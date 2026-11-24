/**
 * Minimal static server for local production testing (mirrors GitHub Pages).
 *   npm run build && npm run serve
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'dist');
const BASE = (process.env.VITE_BASE || '/ATT-WEB/').replace(/\/*$/, '/');
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

const tryFile = async (file) => {
  try {
    const stat = await fs.stat(file);
    if (stat.isDirectory()) {
      const index = path.join(file, 'index.html');
      const indexStat = await fs.stat(index).catch(() => null);
      if (indexStat?.isFile()) return index;
      return null;
    }
    return stat.isFile() ? file : null;
  } catch {
    return null;
  }
};

const sendFile = async (res, file, status = 200) => {
  const body = await fs.readFile(file);
  res.writeHead(status, {
    'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-cache',
    'service-worker-allowed': BASE,
  });
  res.end(body);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    pathname = url.pathname;
  }

  if (pathname === BASE.slice(0, -1)) {
    res.writeHead(301, { location: BASE });
    res.end();
    return;
  }

  if (!pathname.startsWith(BASE)) {
    res.writeHead(302, { location: BASE });
    res.end();
    return;
  }

  let rel = pathname.slice(BASE.length);
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';

  const normalized = path.normalize(rel).replace(/^([.][.][\\/])+/, '');
  const file = await tryFile(path.join(ROOT, normalized));

  if (file) {
    await sendFile(res, file);
    return;
  }

  if (!path.extname(normalized)) {
    const html = await tryFile(path.join(ROOT, path.dirname(normalized), 'index.html'));
    if (html) {
      await sendFile(res, html);
      return;
    }
  }

  const fallback = path.join(ROOT, '404.html');
  const notFound = await tryFile(fallback);
  if (notFound) {
    await sendFile(res, notFound, 404);
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[serve] http://localhost:${PORT}${BASE}`);
});
