async function grok(sys, msgs) {
  const key = process.env.XAI_API_KEY; if (!key) throw new Error('no xai key');
  const r = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({ model: process.env.XAI_MODEL || 'grok-3-mini', messages: [{ role: 'system', content: sys }, ...msgs] }),
  });
  const j = await r.json(); const o = j?.choices?.[0]?.message?.content;
  if (!r.ok || !o) throw new Error('xai failed'); return o.trim();
}
async function gemini(sys, msgs) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY; if (!key) throw new Error('no gemini key');
  const m = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: msgs.map((x) => ({ role: x.role === 'assistant' ? 'model' : 'user', parts: [{ text: x.content }] })) }),
  });
  const j = await r.json(); const o = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
  if (!r.ok || !o) throw new Error('gemini failed'); return o.trim();
}
exports.ask = async (sys, msgs) => {
  for (const [provider, fn] of [['Grok', grok], ['Gemini', gemini]]) {
    try { return { text: await fn(sys, msgs), provider }; } catch (e) { /* next */ }
  }
  return null;
};
