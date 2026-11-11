const P = {
  compress: 'Rewrite the user prompt so it uses far fewer tokens while keeping EVERY requirement, constraint and detail. Remove filler. Return only the rewritten prompt.',
  structure: 'Turn the user notes into one clear, structured prompt (goal, context, requirements, output format). Keep every fact. Return only the prompt.',
  clarify: 'Rewrite the user prompt to remove ambiguity and repetition. If you must assume something, add one line at the end starting with "Assumed:". Return only the prompt.',
  plan: 'Split the user goal into the FEWEST dense, self-contained prompts to send to an AI chat assistant one after another, so a limited message budget is not wasted. Number them. Each prompt must say what to produce and what to skip. Return only the numbered prompts.',
};
const hits = new Map();
const ALLOW = ['https://claude.ai', 'https://www.codelyteam.com'];

async function grok(sys, text) {
  const key = process.env.XAI_API_KEY; if (!key) throw new Error('no xai key');
  const r = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({ model: process.env.XAI_MODEL || 'grok-3-mini', temperature: 0.3, messages: [{ role: 'system', content: sys }, { role: 'user', content: text }] }),
  });
  const j = await r.json(); const out = j?.choices?.[0]?.message?.content;
  if (!r.ok || !out) throw new Error('xai failed'); return out.trim();
}
async function gemini(sys, text) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY; if (!key) throw new Error('no gemini key');
  const m = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: 'user', parts: [{ text }] }], generationConfig: { temperature: 0.3 } }),
  });
  const j = await r.json(); const out = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
  if (!r.ok || !out) throw new Error('gemini failed'); return out.trim();
}

module.exports = async (req, res) => {
  const o = req.headers.origin;
  if (o && ALLOW.includes(o)) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (list.length >= 30) return res.status(429).json({ error: 'Too many requests. Try again in a while.' });
  list.push(now); hits.set(ip, list);

  const { mode, text, budget } = req.body || {};
  if (!P[mode]) return res.status(400).json({ error: 'Unknown mode.' });
  if (typeof text !== 'string' || !text.trim() || text.length > 8000) return res.status(400).json({ error: 'Text must be 1 to 8000 characters.' });
  let sys = P[mode];
  if (mode === 'plan' && Number.isFinite(budget)) sys += ` The user has roughly ${Math.max(0, Math.round(budget))} tokens of budget left, so keep the number of prompts small.`;

  for (const [name, fn] of [['Grok', grok], ['Gemini', gemini]]) {
    try { return res.status(200).json({ text: await fn(sys, text), provider: name }); } catch (e) { /* try next */ }
  }
  res.status(502).json({ error: 'Both AI providers failed. Check the API keys in Vercel.' });
};
