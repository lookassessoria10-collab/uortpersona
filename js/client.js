// Cliente da API, identificação do aparelho e fila offline de respostas.
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* modo privado */ } },
};
export { LS };

/** Identificador aleatório deste aparelho (um voto por pergunta por aparelho). */
export function participantId() {
  let id = LS.get('maia-pid', null);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    LS.set('maia-pid', id);
  }
  return id;
}

export const presenterKey = {
  get: () => LS.get('maia-key', ''),
  set: k => (k ? LS.set('maia-key', k) : LS.del('maia-key')),
};

async function call(path, { method = 'GET', body, key } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (key) headers['x-presenter-key'] = key;
  const r = await fetch('/api/' + path, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  let data = {};
  try { data = await r.json(); } catch { /* resposta vazia */ }
  if (!r.ok) {
    const err = new Error(data.error || `Erro ${r.status}`);
    err.status = r.status; throw err;
  }
  return data;
}

// ---- fila: respostas que não chegaram ao servidor são reenviadas depois ----
const QKEY = 'maia-queue';
const queueKey = v => `${v.session}|${v.pid}|${v.qid}`;

export async function flushQueue() {
  const q = LS.get(QKEY, {});
  for (const [k, vote] of Object.entries(q)) {
    try {
      await call('vote', { method: 'POST', body: vote });
      delete q[k];
    } catch (e) {
      if (e.status && e.status < 500) delete q[k]; // erro definitivo (dado inválido)
      else break;
    }
  }
  LS.set(QKEY, q);
  return Object.keys(q).length;
}
export const pendingVotes = () => Object.keys(LS.get(QKEY, {})).length;

export const api = {
  status: key => call('status', { key }),
  results: (session, key) => call(`results?session=${encodeURIComponent(session)}`, { key }),
  clear: (session, key) => call(`results?session=${encodeURIComponent(session)}`, { method: 'DELETE', key }),
  /** Envia uma resposta. Sem conexão, guarda na fila e devolve { queued: true }. */
  async vote(vote) {
    try {
      const out = await call('vote', { method: 'POST', body: vote });
      flushQueue();
      return { ok: true, ...out };
    } catch (e) {
      if (e.status && e.status < 500) return { ok: false, error: e.message };
      const q = LS.get(QKEY, {});
      q[queueKey(vote)] = vote;
      LS.set(QKEY, q);
      return { ok: false, queued: true, error: e.message };
    }
  },
};

addEventListener('online', () => flushQueue());
