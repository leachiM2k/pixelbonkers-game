import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'output');
const PORT = Number(process.argv[2] ?? 8791);

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.glb': 'model/gltf-binary',
  '.css': 'text/css',
  '.map': 'application/json',
};

await mkdir(OUT, { recursive: true });

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'POST' && url.pathname === '/save') {
      const name = url.searchParams.get('name') ?? '';
      if (!/^[\w.-]+$/.test(name)) { res.writeHead(400); res.end('bad name'); return; }
      const chunks = [];
      for await (const c of req) chunks.push(c);
      await writeFile(join(OUT, name), Buffer.concat(chunks));
      res.writeHead(200);
      res.end('ok');
      return;
    }
    let p = normalize(join(ROOT, decodeURIComponent(url.pathname)));
    if (!p.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    let file = p;
    if (url.pathname.endsWith('/')) file = join(p, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    console.error('[server]', err);
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`serving on http://127.0.0.1:${PORT}`));
