/* Armazenamento das respostas.
   - Na Vercel: Upstash Redis via REST (variáveis KV_REST_API_URL / KV_REST_API_TOKEN,
     criadas automaticamente pela integração "Upstash for Redis" do Marketplace da Vercel;
     também aceita UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
   - No computador (npm run dev): memória do processo, sem configuração. */

// Aceita os nomes padrão e também prefixos personalizados escolhidos na integração
// (ex.: MAIA_KV_REST_API_URL / MAIA_KV_REST_API_TOKEN).
function findEnv(exact, suffixes) {
  for (const k of exact) if (process.env[k]) return process.env[k];
  const key = Object.keys(process.env).find(k => suffixes.some(s => k.endsWith(s)) && !k.includes('READ_ONLY'));
  return key ? process.env[key] : '';
}
const REST_URL = findEnv(['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL'], ['_REST_API_URL', 'REDIS_REST_URL']);
const REST_TOKEN = findEnv(['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN'], ['_REST_API_TOKEN', 'REDIS_REST_TOKEN']);

export const K = {
  sessions: 'maia:sessions',
  people: s => `maia:s:${s}:people`,
  answers: (s, q) => `maia:s:${s}:q:${q}`,
};

/** 'redis' | 'memory' | 'none' (na Vercel sem banco configurado). */
export function storageKind() {
  if (REST_URL && REST_TOKEN) return 'redis';
  return process.env.VERCEL ? 'none' : 'memory';
}

const mem = globalThis.__maiaMem || (globalThis.__maiaMem = new Map());

function memExec([cmd, key, ...args]) {
  switch (cmd) {
    case 'GET': return mem.has(key) ? mem.get(key) : null;
    case 'SET': mem.set(key, args[0]); return 'OK';
    case 'HSET': {
      const h = mem.get(key) || new Map();
      for (let i = 0; i < args.length; i += 2) h.set(args[i], args[i + 1]);
      mem.set(key, h); return 1;
    }
    case 'HGETALL': return mem.has(key) ? [...mem.get(key)].flat() : [];
    case 'HDEL': { const h = mem.get(key); return h ? args.filter(f => h.delete(f)).length : 0; }
    case 'SADD': {
      const s = mem.get(key) || new Set();
      args.forEach(a => s.add(a)); mem.set(key, s); return 1;
    }
    case 'SREM': { const s = mem.get(key); args.forEach(a => s && s.delete(a)); return 1; }
    case 'SMEMBERS': return mem.has(key) ? [...mem.get(key)] : [];
    case 'DEL': return [key, ...args].filter(k => mem.delete(k)).length;
    default: throw new Error('Comando não suportado: ' + cmd);
  }
}

/** Executa vários comandos Redis em sequência (pipeline). */
export async function exec(cmds) {
  const kind = storageKind();
  if (kind === 'memory') return cmds.map(memExec);
  if (kind === 'none') {
    const err = new Error('Banco de dados não configurado. Conecte o Upstash Redis ao projeto na Vercel (veja o README).');
    err.status = 503; throw err;
  }
  const r = await fetch(REST_URL.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error(`Falha no banco de dados (${r.status})`);
  const out = await r.json();
  return out.map(o => { if (o.error) throw new Error(o.error); return o.result; });
}

export function hashToObject(flat) {
  const o = {};
  for (let i = 0; i < (flat || []).length; i += 2) {
    try { o[flat[i]] = JSON.parse(flat[i + 1]); } catch { /* ignora registro corrompido */ }
  }
  return o;
}
