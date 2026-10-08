// POST /api/vote — registra (ou substitui) a resposta de um participante.
// Corpo: { session, pid, qid, value, name? }
// Cada aparelho tem um identificador (pid): se a pessoa mudar de ideia, a resposta nova substitui a anterior.
import { byId, normalize } from '../js/config.js';
import { exec, K } from '../lib/store.js';
import { handler, send, readBody, cleanSession, cleanText } from '../lib/http.js';

export default handler(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' });
  const b = await readBody(req);

  const q = byId(b.qid);
  if (!q) return send(res, 400, { error: 'Pergunta desconhecida.' });
  const pid = String(b.pid || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
  if (!pid) return send(res, 400, { error: 'Participante inválido.' });
  const session = cleanSession(b.session);

  // value: null → a pessoa desmarcou tudo; apaga a resposta anterior
  if (b.value === null) {
    await exec([['HDEL', K.answers(session, q.id), pid]]);
    return send(res, 200, { ok: true, session });
  }
  const v = normalize(q, b.value);
  if (v === undefined) return send(res, 400, { error: 'Resposta inválida para esta pergunta.' });

  const ts = Date.now();
  await exec([
    ['SADD', K.sessions, session],
    ['HSET', K.answers(session, q.id), pid, JSON.stringify({ v, ts })],
    ['HSET', K.people(session), pid, JSON.stringify({ name: cleanText(b.name, 60), ts })],
  ]);
  send(res, 200, { ok: true, session });
});
