import { timingSafeEqual } from 'node:crypto';

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export async function readBody(req) {
  try {
    if (req.body !== undefined && req.body !== null && req.body !== '') {
      return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
  } catch { return {}; }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString('utf8');
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

export const keyConfigured = () => Boolean(process.env.PRESENTER_KEY);

/** Confere o cabeçalho x-presenter-key com a variável PRESENTER_KEY. */
export function isPresenter(req) {
  const key = process.env.PRESENTER_KEY;
  if (!key) return false;
  const got = Buffer.from(String(req.headers['x-presenter-key'] || ''));
  const want = Buffer.from(key);
  return got.length === want.length && timingSafeEqual(got, want);
}

export function requirePresenter(req) {
  if (isPresenter(req)) return;
  const err = new Error(keyConfigured()
    ? 'Senha da equipe inválida.'
    : 'Defina a variável PRESENTER_KEY nas configurações do projeto na Vercel.');
  err.status = keyConfigured() ? 401 : 503;
  throw err;
}

/** "Reunião Sócios 10/10" → "reuniao-socios-10-10" */
export function cleanSession(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'online';
}

export const cleanText = (s, max) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);

export const query = req => new URL(req.url, 'http://localhost').searchParams;

export function handler(fn) {
  return async (req, res) => {
    try { await fn(req, res); } catch (e) { send(res, e.status || 500, { error: e.message || 'Erro inesperado' }); }
  };
}
