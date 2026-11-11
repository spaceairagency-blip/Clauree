const crypto = require('crypto');
const { sb, on, rl } = require('./_lib/sb');

const ALLOW = ['https://claude.ai', 'https://www.codelyteam.com'];
const num = (v) => Number.isFinite(v);
const list = (a) => (Array.isArray(a) ? a : []);
const cleanHits = (a) => list(a).filter((x) => x && num(x.t) && num(x.u)).map((x) => ({ t: x.t, u: x.u })).slice(-10);
const cleanHist = (a) => list(a).filter((x) => x && num(x.s) && num(x.e) && num(x.n) && num(x.u)).map((x) => ({ s: x.s, e: x.e, n: x.n, u: x.u })).slice(-30);
const merge = (a, b, k, n) => {
  const m = new Map();
  [...a, ...b].forEach((x) => m.set(x[k], x));
  return [...m.values()].sort((x, y) => x[k] - y[k]).slice(-n);
};

module.exports = async (req, res) => {
  const o = req.headers.origin;
  if (o && ALLOW.includes(o)) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!on()) return res.status(503).json({ error: 'Sync is not set up on this server.' });

  const { key, action, hits, hist } = req.body || {};
  if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{32,64}$/.test(key)) return res.status(400).json({ error: 'Invalid sync key.' });
  const kh = crypto.createHash('sha256').update(key).digest('hex');
  if ((await rl('sync:' + kh, 120)) === false) return res.status(429).json({ error: 'Too many requests. Try again later.' });

  try {
    const rows = await sb(`clauree_sync?key_hash=eq.${kh}&select=hits,hist`);
    const cur = (rows && rows[0]) || { hits: [], hist: [] };
    if (action === 'get') return res.status(200).json({ hits: cur.hits, hist: cur.hist });
    if (action !== 'put') return res.status(400).json({ error: 'Unknown action.' });
    const out = { hits: merge(list(cur.hits), cleanHits(hits), 't', 10), hist: merge(list(cur.hist), cleanHist(hist), 's', 30) };
    await sb('clauree_sync?on_conflict=key_hash', {
      method: 'POST', prefer: 'resolution=merge-duplicates',
      body: { key_hash: kh, ...out, updated_at: new Date().toISOString() },
    });
    return res.status(200).json(out);
  } catch (e) {
    return res.status(502).json({ error: 'Storage error. Try again later.' });
  }
};
