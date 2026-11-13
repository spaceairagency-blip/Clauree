const crypto = require('crypto');
const { rl } = require('./_lib/sb');
const { ask } = require('./_lib/llm');

const ALLOW = ['https://claude.ai', 'https://www.codelyteam.com'];
const hits = new Map();
const SYS = `You are Clauree, an AI assistant continuing a conversation the user started with Claude. Answer directly and helpfully in Markdown.
When you create files, put each file in its own fenced block whose opening line is the language, a colon, and the file path, for example \`\`\`js:src/app.js. For a project, create every file this way so the user can download them as a zip.
You cannot execute commands yourself here. If asked to run something, give the exact commands, or write a script. JavaScript and HTML blocks can be run by the user with the Run button.`;

module.exports = async (req, res) => {
  const o = req.headers.origin;
  if (o && ALLOW.includes(o)) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  const h = crypto.createHash('sha256').update((process.env.SUPABASE_URL || 'clauree') + '|' + ip).digest('hex').slice(0, 40);
  let ok = await rl('chat:' + h, 60);
  if (ok === null) {
    const now = Date.now(), l = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
    ok = l.length < 40; if (ok) { l.push(now); hits.set(ip, l); }
  }
  if (!ok) return res.status(429).json({ error: 'Too many requests. Try again in a while.' });

  const raw = (req.body || {}).messages;
  if (!Array.isArray(raw) || !raw.length || raw.length > 60) return res.status(400).json({ error: 'Send between 1 and 60 messages.' });
  let total = 0; const msgs = [];
  for (const m of raw) {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 8000) return res.status(400).json({ error: 'Bad message.' });
    total += m.content.length;
    const last = msgs[msgs.length - 1];
    if (last && last.role === m.role) last.content += '\n\n' + m.content; else msgs.push({ role: m.role, content: m.content });
  }
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || total > 80000) return res.status(400).json({ error: 'Conversation is too long or empty.' });

  const out = await ask(SYS, msgs);
  if (!out) return res.status(502).json({ error: 'Both AI providers failed. Check the API keys in Vercel.' });
  return res.status(200).json(out);
};
