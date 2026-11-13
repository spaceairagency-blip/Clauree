// Usage: node scripts/build-extension.js https://your-site.vercel.app
// Builds extension/dist from the same engine the bookmarklet uses (public/clauree.js).
const fs = require('fs'), path = require('path');
const origin = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https:\/\/[^/\s]+$/.test(origin)) { console.error('Usage: node scripts/build-extension.js https://your-site.vercel.app'); process.exit(1); }
const root = path.join(__dirname, '..'), out = path.join(root, 'extension', 'dist');
fs.mkdirSync(out, { recursive: true });
const code = fs.readFileSync(path.join(root, 'public', 'clauree.js'), 'utf8').replace(/__ORIGIN__/g, origin);
fs.writeFileSync(path.join(out, 'clauree.js'), 'window.__clrExt = true;\n' + code);
const host = new URL(origin).hostname;
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension', 'manifest.json'), 'utf8').replace(/__HOST__/g, host));
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.cpSync(path.join(root, 'extension', 'icons'), path.join(out, 'icons'), { recursive: true });
console.log('Built extension/dist for ' + origin + '. Zip the CONTENTS of that folder (not the folder itself) to submit it.');
