const url = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const on = () => !!(url() && key());

async function sb(path, { method = 'GET', body, prefer } = {}) {
  const r = await fetch(url() + '/rest/v1/' + path, {
    method,
    headers: { apikey: key(), Authorization: 'Bearer ' + key(), 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error('supabase ' + r.status);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// true = allowed. If Supabase is not set up or is down, the caller falls back to its own limit.
async function rl(k, limit) {
  if (!on()) return null;
  try { return await sb('rpc/clauree_hit', { method: 'POST', body: { p_k: k, p_limit: limit } }); } catch (e) { return null; }
}

module.exports = { sb, on, rl };
