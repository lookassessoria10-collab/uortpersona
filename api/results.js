// GET    /api/results?session=x  — todas as respostas da sessão (linhas) + participantes
// GET    /api/results?session=*  — todas as sessões
// DELETE /api/results?session=x  — apaga as respostas da sessão
// Exige o cabeçalho x-presenter-key (a chave da equipe, variável PRESENTER_KEY).
import { QUESTIONS } from '../js/config.js';
import { exec, K, hashToObject, storageKind } from '../lib/store.js';
import { handler, send, requirePresenter, cleanSession, query } from '../lib/http.js';

export default handler(async (req, res) => {
  requirePresenter(req);
  const raw = query(req).get('session') || '*';

  if (req.method === 'DELETE') {
    const session = cleanSession(raw);
    await exec([
      ['DEL', K.people(session), ...QUESTIONS.map(q => K.answers(session, q.id))],
      ['SREM', K.sessions, session],
    ]);
    return send(res, 200, { ok: true });
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'Método não permitido.' });

  const [sessionList] = await exec([['SMEMBERS', K.sessions]]);
  const sessions = (sessionList || []).sort();
  const wanted = raw === '*' ? sessions : [cleanSession(raw)];

  const cmds = [];
  wanted.forEach(s => {
    cmds.push(['HGETALL', K.people(s)]);
    QUESTIONS.forEach(q => cmds.push(['HGETALL', K.answers(s, q.id)]));
  });
  const out = cmds.length ? await exec(cmds) : [];

  const people = {};
  const rows = [];
  let i = 0;
  wanted.forEach(s => {
    people[s] = hashToObject(out[i++]);
    QUESTIONS.forEach(q => {
      Object.entries(hashToObject(out[i++])).forEach(([pid, a]) => rows.push({ session: s, pid, qid: q.id, v: a.v, ts: a.ts }));
    });
  });

  send(res, 200, { storage: storageKind(), sessions, people, rows });
});
