// Local dev server. Run: node scripts/dev.js   (Node 18+, nothing to install)
// Serves public/ and runs the api/ functions the same way Vercel does. Keys come from .env.local.
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  try {
    for (const l of fs.readFileSync(path.join(root, f), 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch (e) { /* file not there */ }
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.css': 'text/css', '.txt': 'text/plain' };
const PORT = +process.env.PORT || 3000;

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let p = decodeURIComponent(url.pathname);
  if (p === '/app') { res.statusCode = 301; res.setHeader('Location', '/app/'); return res.end(); }
  if (p.startsWith('/api/')) {
    const name = p.slice(5).replace(/[^a-z0-9_-]/gi, '');
    const file = path.join(root, 'api', name + '.js');
    if (!name || !fs.existsSync(file)) { res.statusCode = 404; return res.end('Not found'); }
    let raw = ''; for await (const c of req) raw += c;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch (e) { req.body = {}; }
    res.status = (n) => { res.statusCode = n; return res; };
    res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return res; };
    if (req.method === 'OPTIONS' && req.headers['access-control-request-private-network']) res.setHeader('Access-Control-Allow-Private-Network', 'true');
    try { delete require.cache[require.resolve(file)]; await require(file)(req, res); }
    catch (e) { console.error(e); if (!res.headersSent) { res.statusCode = 500; res.end('Server error'); } }
    return;
  }
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, 'public', p);
  if (!f.startsWith(path.join(root, 'public')) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => {
  const has = (v) => (v ? 'yes' : 'no');
  console.log(`Clauree running at http://localhost:${PORT}`);
  console.log(`Keys: Grok ${has(process.env.XAI_API_KEY)}, Gemini ${has(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)}, Supabase ${has(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)}`);
});
