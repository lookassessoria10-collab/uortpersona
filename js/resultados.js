/* ==========================================================================
   PERSONAGENS · UORT — painel de respostas (só para a equipe)
   Lê /api/results (exige a chave PRESENTER_KEY), agrega no navegador,
   filtra por rodada e exporta CSV (abre direto no Excel).
   ========================================================================== */
import { QUESTIONS, byId, aggregate, answerLabel, applies } from './config.js';
import { injectIcons, icon } from './icons.js';
import { api, LS, presenterKey } from './client.js';

injectIcons();

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => new Intl.NumberFormat('pt-BR').format(n);
const pct = (c, n) => (n ? Math.round(c / n * 100) : 0);

const st = {
  key: presenterKey.get(),
  session: LS.get('maia-dash-session', null),
  search: '',
  limit: 150,
  data: null,
  timer: null,
};

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------------------------------------------------------------- acesso */
function showGate(msg = '') {
  $('#gate').hidden = false;
  $('#dash').hidden = true;
  $('#tools').hidden = true;
  $('#gate-err').textContent = msg;
  $('#gate-key').focus();
}
$('#gate-form').addEventListener('submit', e => {
  e.preventDefault();
  st.key = $('#gate-key').value.trim();
  presenterKey.set(st.key);
  load();
});

async function load(quiet) {
  if (!st.key) return showGate();
  try {
    st.data = await api.results(st.session || '*', st.key);
  } catch (e) {
    if (e.status === 401 || e.status === 503) return showGate(e.message);
    if (!quiet) toast(e.message || 'Não foi possível carregar as respostas.');
    return;
  }
  // primeira visita: abre a única rodada existente (ou todas somadas, se houver mais de uma)
  if (!st.session) st.session = st.data.sessions.length === 1 ? st.data.sessions[0] : '*';
  $('#gate').hidden = true;
  $('#dash').hidden = false;
  $('#tools').hidden = false;
  renderSessions();
  render();
}

/* ---------------------------------------------------------------- filtros */
function renderSessions() {
  const list = [...st.data.sessions];
  if (st.session !== '*' && !list.includes(st.session)) list.push(st.session);
  $('#session').innerHTML = '<option value="*">Todas as rodadas</option>' + list.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  $('#session').value = st.session;
}
$('#session').addEventListener('change', e => {
  st.session = e.target.value;
  LS.set('maia-dash-session', st.session);
  load();
});
$('#reload').addEventListener('click', () => load());
$('#auto').addEventListener('change', e => {
  clearInterval(st.timer);
  if (e.target.checked) st.timer = setInterval(() => load(true), 8000);
});
$('#search').addEventListener('input', e => { st.search = e.target.value.trim().toLowerCase(); st.limit = 150; renderTable(); });
$('#more').addEventListener('click', () => { st.limit += 300; renderTable(); });

/* ---------------------------------------------------------------- dados */
const person = r => st.data.people[r.session]?.[r.pid] || {};
const idOf = r => `${r.session}|${r.pid}`;

/* ---------------------------------------------------------------- painel */
function render() {
  const rows = st.data.rows;
  const warn = [];
  if (st.data.storage === 'memory') warn.push('Servidor local: as respostas ficam guardadas apenas enquanto o servidor estiver aberto.');
  if (st.session === '*' && st.data.sessions.length > 1) warn.push('Mostrando todas as rodadas somadas.');
  $('#warn').hidden = !warn.length;
  $('#warn').textContent = warn.join(' ');

  // indicadores
  const ids = new Set(rows.map(idOf));
  // respondeu tudo = todas as perguntas do caminho dessa pessoa (as de "when" dependem da proposta escolhida)
  const perPerson = {};
  rows.forEach(r => { (perPerson[idOf(r)] ||= {})[r.qid] = r.v; });
  const complete = Object.values(perPerson).filter(ans => QUESTIONS.every(q => !applies(q, ans) || q.id in ans)).length;
  const last = rows.reduce((m, r) => Math.max(m, r.ts || 0), 0);
  $('#kpis').innerHTML = `
    <div class="kpi hero"><span>Participantes</span><b>${fmt(ids.size)}</b><small>${last ? 'última resposta ' + new Date(last).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'nenhuma resposta ainda'}</small></div>
    <div class="kpi"><span>Responderam tudo</span><b>${fmt(complete)}</b><small>${pct(complete, ids.size)}% dos participantes</small></div>
    <div class="kpi"><span>Pararam no meio</span><b>${fmt(ids.size - complete)}</b><small>responderam só parte das escolhas</small></div>
    ${['personagem', 'nome-ela', 'nome-ele'].map(id => nameKpi(byId(id), rows.filter(r => r.qid === id))).join('')}`;

  $('#charts').innerHTML = QUESTIONS.map(q => chartCard(q, rows.filter(r => r.qid === q.id))).join('');
  renderTable();
}

// placar da proposta escolhida e dos nomes: a opção mais votada de cada um
function nameKpi(q, answers) {
  const a = aggregate(q, answers);
  const [first, second] = q.options.map(o => ({ o, c: a.counts[o.id] })).sort((x, y) => y.c - x.c);
  const lead = !a.n ? 'Sem votos' : first.c === second.c ? 'Empate' : first.o.label;
  const split = q.options.map(o => `${o.label} ${pct(a.counts[o.id], a.n)}%`).join(' · ');
  return `<div class="kpi"><span>${q.short}</span><b>${esc(lead)}</b><small>${a.n ? `${split} · ${fmt(a.n)} ${a.n === 1 ? 'voto' : 'votos'}` : 'ninguém votou ainda'}</small></div>`;
}

function chartCard(q, answers) {
  const a = aggregate(q, answers);
  const who = q.when?.personagem && byId('personagem').options.find(o => o.id === q.when.personagem)?.label.toLowerCase();
  const only = who ? `<p class="qcard-sub">Só para quem escolheu a proposta "${who}".</p>` : '';
  const head = `<div class="qcard-h"><div><small>${q.n} · ${q.short}</small><h3>${esc(q.title)}</h3></div><span class="n">${fmt(a.n)} ${a.n === 1 ? 'resposta' : 'respostas'}</span></div>${only}`;
  if (!a.n) return `<article class="qcard">${head}<p class="empty">Ainda sem respostas.</p></article>`;

  const sorted = q.options.map(o => ({ o, c: a.counts[o.id] })).sort((x, y) => y.c - x.c);
  const max = Math.max(1, sorted[0].c);
  const rowsHTML = sorted.map(({ o, c }) => {
    const p = pct(c, a.n), top = c > 0 && c === sorted[0].c;
    return `<div class="row${top ? ' top' : ''}" data-tip="<b>${esc(o.label)}</b>${c} de ${a.n} ${a.n === 1 ? 'pessoa' : 'pessoas'} (${p}%)">
      <span class="lbl">${esc(o.label)}${top ? `<span class="tag win">${icon('star')}Mais escolhida</span>` : ''}</span>
      <span class="track"><span class="fill" style="width:${(c / max * 100).toFixed(1)}%"></span></span>
      <span class="val">${fmt(c)}<small>${p}%</small></span></div>`;
  }).join('');
  const sub = q.type === 'multi' ? `<p class="qcard-sub">Cada pessoa podia escolher até ${q.max}. O percentual é sobre quem respondeu.</p>` : '';
  return `<article class="qcard">${head}${sub}<div class="rows">${rowsHTML}</div></article>`;
}

/* ---------------------------------------------------------------- tabela */
function tableRows() {
  return st.data.rows.slice().sort((a, b) => b.ts - a.ts).map(r => {
    const p = person(r), q = QUESTIONS.find(x => x.id === r.qid);
    return { r, date: new Date(r.ts).toLocaleString('pt-BR'), name: p.name || '—', q: q ? q.short : r.qid, ans: q ? answerLabel(q, r.v) : String(r.v) };
  }).filter(x => !st.search || `${x.name} ${x.q} ${x.ans} ${x.r.session}`.toLowerCase().includes(st.search));
}
function renderTable() {
  const all = tableRows();
  const list = all.slice(0, st.limit);
  $('#table').innerHTML = `<thead><tr><th>Data e hora</th><th>Rodada</th><th>Nome</th><th>Pergunta</th><th>Resposta</th></tr></thead>
    <tbody>${list.length ? list.map(x => `<tr><td>${x.date}</td><td>${esc(x.r.session)}</td><td>${esc(x.name)}</td><td>${esc(x.q)}</td><td class="ans">${esc(x.ans)}</td></tr>`).join('')
      : '<tr><td colspan="5">Nenhuma resposta encontrada.</td></tr>'}</tbody>`;
  $('#more').hidden = all.length <= st.limit;
}

/* ---------------------------------------------------------------- dica ao passar o mouse */
const tip = $('#tip');
$('#charts').addEventListener('pointermove', e => {
  const el = e.target.closest('[data-tip]');
  if (!el) { tip.hidden = true; return; }
  tip.innerHTML = el.dataset.tip;
  tip.hidden = false;
  tip.style.left = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8) + 'px';
  tip.style.top = (e.clientY + 16) + 'px';
});
$('#charts').addEventListener('pointerleave', () => { tip.hidden = true; });

/* ---------------------------------------------------------------- CSV */
function download(name, lines) {
  const csv = '﻿' + lines.map(l => l.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const stamp = () => new Date().toISOString().slice(0, 10);
const sessName = () => (st.session === '*' ? 'todas' : st.session);
$('#csv-rows').addEventListener('click', () => {
  const lines = [['data_hora', 'rodada', 'participante', 'nome', 'pergunta_id', 'pergunta', 'resposta', 'resposta_codigo']];
  st.data.rows.slice().sort((a, b) => a.ts - b.ts).forEach(r => {
    const q = QUESTIONS.find(x => x.id === r.qid), p = person(r);
    lines.push([new Date(r.ts).toLocaleString('pt-BR'), r.session, r.pid, p.name || '', r.qid, q?.title || '',
      q ? answerLabel(q, r.v) : r.v, Array.isArray(r.v) ? r.v.join('|') : r.v]);
  });
  download(`personagens-respostas-${sessName()}-${stamp()}.csv`, lines);
});
$('#csv-sum').addEventListener('click', () => {
  const rows = st.data.rows;
  const lines = [['pergunta', 'opcao', 'escolhas', 'percentual_de_quem_respondeu', 'responderam']];
  QUESTIONS.forEach(q => {
    const a = aggregate(q, rows.filter(r => r.qid === q.id));
    q.options.forEach(o => lines.push([q.title, o.label, a.counts[o.id], pct(a.counts[o.id], a.n) + '%', a.n]));
  });
  download(`personagens-resumo-${sessName()}-${stamp()}.csv`, lines);
});

/* ---------------------------------------------------------------- apagar rodada */
$('#clear').addEventListener('click', async () => {
  if (st.session === '*') { toast('Escolha uma rodada específica para apagar.'); return; }
  const typed = prompt(`Para apagar todas as respostas da rodada "${st.session}", digite o nome dela:`);
  if (typed !== st.session) { if (typed != null) toast('Nome diferente. Nada foi apagado.'); return; }
  try { await api.clear(st.session, st.key); toast('Respostas apagadas.'); st.session = null; LS.del('maia-dash-session'); load(); } catch (e) { toast(e.message); }
});

load();
