// Servidor local: arquivos estáticos + as mesmas funções de /api usadas na Vercel.
// Uso: npm run dev  (ou dois cliques em ABRIR-APRESENTACAO.bat)
// As respostas ficam na memória enquanto o servidor estiver aberto.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 5173;
process.env.PRESENTER_KEY ||= 'uort';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
};

async function serveStatic(pathname, res) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const candidates = extname(rel) ? [rel] : [rel + '.html', rel + '/index.html'];
  for (const c of candidates) {
    const file = normalize(join(ROOT, c));
    if (!file.startsWith(ROOT) || /[\\/](api|lib|node_modules)[\\/]/.test(file.slice(ROOT.length - 1))) break;
    try {
      if (!(await stat(file)).isFile()) continue;
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      return res.end(await readFile(file));
    } catch { /* tenta o próximo */ }
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Não encontrado');
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const api = pathname.match(/^\/api\/([a-z]+)\/?$/);
  if (api) {
    try {
      const mod = await import(pathToFileURL(join(ROOT, 'api', api[1] + '.js')).href);
      return mod.default(req, res);
    } catch {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end('{"error":"Rota não encontrada"}');
    }
  }
  serveStatic(pathname, res);
}).listen(PORT, () => {
  console.log(`\n  Personagens · UORT rodando em http://localhost:${PORT}`);
  console.log(`  Painel de respostas:  http://localhost:${PORT}/resultados`);
  console.log(`  Senha do painel (local): ${process.env.PRESENTER_KEY}\n`);
});
