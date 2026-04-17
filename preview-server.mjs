/**
 *   editörü için statik dosya sunucusu (yerel önizleme + ağ üzerinden host).
 *
 * Kullanım:
 *   node preview-server.mjs
 *
 * Ortam değişkenleri:
 *   PORT   — dinlenecek port (varsayılan: 8080)
 *   HOST   — dinlenecek adres (varsayılan: 0.0.0.0 = tüm arayüzler; yalnızca yerel için 127.0.0.1)
 *
 * Örnek (sadece bu makine):
 *   set HOST=127.0.0.1 && node preview-server.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const PORT = Number(process.env.PORT) || 1010;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function safeJoin(root, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = path.join(root, normalized);
  if (!full.startsWith(root)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  const url = new URL(req.url || '/', 'http://localhost');
  let pathname = url.pathname;

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }
  if (pathname === '/linkedin') pathname = '/linkedin-editor.html';
  if (pathname === '/instagram') pathname = '/instagram-editor.html';
  if (pathname === '/studio') pathname = '/product-studio.html';

  const filePath = safeJoin(ROOT, pathname);

  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(filePath).on('error', () => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
    }).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  const base = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
  console.log(`EPC Icerik Studyosu: ${base}/`);
  console.log(`  - LinkedIn    : ${base}/linkedin-editor.html`);
  console.log(`  - Instagram   : ${base}/instagram-editor.html`);
  console.log(`  - Urun Studyo : ${base}/product-studio.html`);
  if (HOST === '0.0.0.0') {
    console.log(`(Agdan erisim: http://<bu-bilgisayarin-ip-adresi>:${PORT}/ )`);
  }
});
