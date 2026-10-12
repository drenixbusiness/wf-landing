// Tiny static dev server. POST /__poster?name=poster.jpg saves a captured frame into assets/.
// Run: node scripts/dev.mjs  (http://localhost:5173)
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = +(process.env.PORT || 5173);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary', '.ico': 'image/x-icon', '.txt': 'text/plain',
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/__poster') {
    const name = (url.searchParams.get('name') || 'poster.jpg').replace(/[^a-z0-9.-]/gi, '');
    const chunks = [];
    for await (const c of req) chunks.push(c);
    await writeFile(join(root, 'assets', name), Buffer.concat(chunks));
    res.end('saved ' + name);
    return;
  }
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^[\\/]+/, '');
  if (p.includes('..') || p.startsWith('node_modules')) { res.writeHead(403).end(); return; }
  if (!p || /[\\/]$/.test(p)) p += 'index.html';
  let file = join(root, p);
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch {}
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).listen(port, () => console.log(`Wildfire Express dev server → http://localhost:${port}`));
