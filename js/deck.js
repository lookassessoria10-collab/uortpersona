/* ==========================================================================
   MAIA · UORT — motor da apresentação + questionário
   Cada pessoa abre o link, percorre as lâminas e responde ali mesmo.
   As respostas são salvas automaticamente (/api/vote); o resultado só
   aparece no painel da equipe (/resultados).
   No computador: palco 16:9 escalado. No celular/tablet em pé: layout
   vertical que rola (classe .fluid no <html>).
   ========================================================================== */
import { QUESTIONS, SETTINGS, ROLES, byId, normalize, answerLabel } from './config.js';
import { injectIcons, icon } from './icons.js';
import { api, LS, participantId, flushQueue } from './client.js';

injectIcons();

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cleanSession = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'principal';

// ?estatico na URL desliga as animações (computadores lentos, conferência rápida do conteúdo)
const params = new URLSearchParams(location.search);
const staticMode = params.has('estatico');
if (staticMode) document.documentElement.classList.add('no-motion');
const reduced = staticMode || matchMedia('(prefers-reduced-motion: reduce)').matches;

const SESSION = cleanSession(params.get('sessao') || SETTINGS.defaultSession);
const PID = participantId();
const CHAPTERS = { chegada: 'Chegada', escolhas: 'Primeiras escolhas', revelacao: 'Revelação', visual: 'O visual', presenca: 'Presença', fechamento: 'Fechamento' };

const stage = $('#stage');
const frame = $('#frame');
const slides = $$('.slide', stage);
const indexOf = id => slides.findIndex(s => s.dataset.id === id);
const revealIndex = indexOf(SETTINGS.revealSlide);
const recapIndex = indexOf('recap');

const state = {
  i: -1,
  step: 0,
  scale: 1,
  fluid: false,
  local: LS.get('maia-local', {}),                 // respostas desta pessoa
  me: LS.get('maia-me', { name: '', role: '' }),   // perfil
  sent: LS.get('maia-sent', {}),                   // o que já chegou ao servidor
  status: {},                                      // qid → saving | saved | queued | error
  returnTo: null,                                  // volta ao resumo depois de alterar
};
const saveLocal = () => LS.set('maia-local', state.local);
const sentKey = qid => `${SESSION}:${qid}`;
const valueArray = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
const answered = qid => normalize(byId(qid), state.local[qid]) !== undefined;

/* ---------------------------------------------------------------- toast */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ======================================================================
   DECORAÇÃO, NUMERAÇÃO E CARREGAMENTO DAS IMAGENS
   ====================================================================== */
const DECO = {
  l1: '<path class="dr" d="M1920 0H1180c70 150 210 250 400 290 160 34 270 120 340 260Z" fill="url(#g-soft)"/><path class="dl" d="M0 1080V800c140 30 250 120 310 280Z" fill="url(#g-soft-2)"/><path d="M1110 -10c80 190 240 300 470 340 170 30 280 130 350 280" fill="none" stroke="url(#g-line)" stroke-width="2"/>',
  l2: '<path class="dr" d="M1920 1080V690c-150 20-270 110-330 250-20 50-30 95-30 140Z" fill="url(#g-soft-2)"/><path class="dl" d="M0 0h560C500 120 380 200 220 220 120 232 50 270 0 330Z" fill="url(#g-soft)"/><path d="M-20 820c210-10 340 90 390 270" fill="none" stroke="url(#g-line)" stroke-width="2"/>',
  d1: '<path class="dr" d="M1920 0v560c-180-40-310-150-380-320C1500 140 1420 50 1320 0Z" fill="url(#g-dark)"/><path class="dash" d="M-40 900c280-40 470-200 560-440S800 60 1060 -30" fill="none" stroke="#35e8f2" stroke-opacity=".38" stroke-width="1.6" stroke-dasharray="3 10"/><path d="M1340 1100c40-200 170-330 360-380 110-30 190-90 240-170" fill="none" stroke="url(#g-line)" stroke-width="1.6" opacity=".7"/>',
  d2: '<path class="dl" d="M0 1080V520c180 40 320 150 390 320 40 100 110 180 190 240Z" fill="url(#g-dark)"/><path class="dash" d="M1960 140c-280 40-470 200-560 440s-240 400-500 520" fill="none" stroke="#35e8f2" stroke-opacity=".38" stroke-width="1.6" stroke-dasharray="3 10"/>',
};
slides.forEach((s, k) => {
  const d = DECO[s.dataset.deco];
  if (d) s.insertAdjacentHTML('afterbegin', `<svg class="deco" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-hidden="true">${d}</svg>`);
  const foot = $('.sl-foot', s);
  if (foot) foot.insertAdjacentHTML('beforeend', `<span class="pg">${pad(k + 1)} / ${pad(slides.length)}</span>`);
  $$('img', s).forEach(img => { img.decoding = 'async'; });
});
// pré-carrega as imagens das próximas lâminas (as demais chegam sob demanda)
function warm(k) {
  [k + 1, k + 2].forEach(n => slides[n] && $$('img', slides[n]).forEach(img => {
    if (!img.complete && !img.dataset.warm) { img.dataset.warm = '1'; new Image().src = img.currentSrc || img.src; }
  }));
}

/* ======================================================================
   OPÇÕES DAS PERGUNTAS (geradas a partir de config.js)
   ====================================================================== */
const CHECK = `<span class="opt-check" aria-hidden="true">${icon('check')}</span>`;
const lazy = 'loading="lazy" decoding="async"';

const RENDER = {
  papel: q => q.options.map((o, k) => `
    <button class="role opt" data-v="${o.id}" aria-pressed="false">
      <span class="role-n">${pad(k + 1)}</span>
      <span class="role-ic">${icon(o.icon)}</span>
      <span class="role-tx"><b class="role-t">${o.label}</b><span class="role-d">${o.desc}</span></span>${CHECK}
    </button>`).join(''),
  tom: q => q.options.map(o => `
    <button class="tone opt" data-v="${o.id}" aria-pressed="false">
      <span class="tone-k">${o.label}</span>
      <span class="tone-msg"><span class="tone-av"><img src="assets/maia/det-cabelo.webp" alt="" ${lazy}></span><span class="tone-bubble">${o.sample}</span></span>
      <span class="tone-d">${o.desc}</span>${CHECK}
    </button>`).join(''),
  dna: q => q.options.map(o => `
    <button class="trait opt" data-v="${o.id}" aria-pressed="false"><span class="tr-mark">${icon('plus')}</span>${o.label}</button>`).join(''),
  versao: q => q.options.map(o => `
    <button class="ver opt" data-v="${o.id}" aria-pressed="false">
      <img src="${o.img}" alt="" style="--pos:${o.pos || '50% 20%'}" ${lazy}><span class="ver-shade"></span>
      <span class="ver-txt"><b>${o.label}</b><span>${o.desc}</span></span>${CHECK}
    </button>`).join(''),
  cabelo: q => q.options.map(o => `
    <button class="hair opt" data-v="${o.id}" aria-pressed="false">
      <img src="${o.img}" alt="" ${lazy}>
      <span class="hair-tag"><b>${o.label}</b><span>${o.desc}</span></span>${CHECK}
    </button>`).join(''),
  canais: q => q.options.map(o => `
    <button class="ch opt" data-v="${o.id}" aria-pressed="false">${icon(o.icon)}<span>${o.label}</span><span class="ch-ord"></span></button>`).join(''),
  conversa: q => q.options.map(o => `
    <button class="conv opt" data-v="${o.id}" aria-pressed="false">
      <span class="conv-ic">${icon(o.icon)}</span>
      <span class="conv-t"><b>${o.label}</b><span>${o.desc}</span></span><span class="ch-ord"></span>
    </button>`).join(''),
  primeiro: q => q.options.map((o, k) => `
    <button class="fst opt" data-v="${o.id}" aria-pressed="false">
      <span class="fst-img"><img src="${o.img}" alt="" style="--pos:${o.pos || '50% 25%'}" ${lazy}></span>
      <span class="fst-n">${pad(k + 1)}</span>
      <span class="fst-t">${o.label}</span>
      <span class="fst-stamp">Sua candidata<br>à estreia</span>${CHECK}
    </button>`).join(''),
  estilo: () => '',
};

const qSlides = slides.filter(s => s.dataset.q);
qSlides.forEach(slide => {
  const q = byId(slide.dataset.q);
  $('[data-opts]', slide).innerHTML = RENDER[q.id](q);
});

/* ---------- seleção ---------- */
function paintSelection(slide) {
  const q = byId(slide.dataset.q);
  if (q.type === 'pairs') { renderTT(slide); return; }
  const arr = valueArray(state.local[q.id]);
  $$('.opt', slide).forEach(b => {
    const k = arr.indexOf(b.dataset.v);
    b.classList.toggle('is-sel', k >= 0);
    b.setAttribute('aria-pressed', String(k >= 0));
    const ord = $('.ch-ord', b) || $('.tr-mark', b);
    if (ord) ord.innerHTML = k >= 0 ? (q.id === 'dna' ? String(k + 1) : `${k + 1}º`) : (q.id === 'dna' ? icon('plus') : '');
  });
  slide.classList.toggle('has-choice', q.type === 'single' && arr.length > 0);
  slide.classList.toggle('is-full-choice', q.type === 'multi' && arr.length >= q.max);
  if (q.id === 'dna') paintDna(slide, arr);
}

function feedback(slide, animate) {
  const q = byId(slide.dataset.q);
  const fb = $('[data-feedback]', slide);
  if (!fb) return;
  const n = q.type === 'pairs' ? (answered(q.id) ? 1 : 0) : valueArray(state.local[q.id]).length;
  const show = q.type === 'multi' && q.id === 'dna' ? n >= q.max : n > 0;
  if (animate && show) { fb.classList.remove('show'); void fb.offsetWidth; }
  fb.classList.toggle('show', show);
}

function choose(slide, v) {
  const q = byId(slide.dataset.q);
  if (q.type === 'single') {
    state.local[q.id] = v;
  } else {
    const arr = valueArray(state.local[q.id]).slice();
    const k = arr.indexOf(v);
    if (k >= 0) arr.splice(k, 1);
    else if (arr.length >= q.max) {
      const b = $(`.opt[data-v="${v}"]`, slide);
      b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      toast(q.max === 3 ? 'Escolha até três. Desmarque uma para trocar.' : 'Escolha até duas. Desmarque uma para trocar.');
      return;
    } else arr.push(v);
    if (arr.length) state.local[q.id] = arr; else delete state.local[q.id];
  }
  if (navigator.vibrate && state.fluid) navigator.vibrate(12);
  saveLocal();
  paintSelection(slide);
  feedback(slide, true);
  save(q.id);
}

stage.addEventListener('click', e => {
  const opt = e.target.closest('.opt');
  if (!opt) return;
  const slide = opt.closest('.slide');
  if (slide?.dataset.q) choose(slide, opt.dataset.v);
});

/* ---------- esta ou aquela (um par por vez) ---------- */
const tt = { cur: 0, timer: null };
function ttValue() {
  const q = byId('estilo');
  const v = state.local.estilo;
  return Array.isArray(v) && v.length === q.pairs.length ? v.slice() : q.pairs.map(() => null);
}
function renderTT(slide, animate) {
  const q = byId('estilo');
  const v = ttValue();
  const p = q.pairs[tt.cur];
  const box = $('[data-opts]', slide);
  box.innerHTML = `
    <div class="tt-top"><span class="tt-count">Par <b>${tt.cur + 1}</b> de ${q.pairs.length}</span>
      <span class="tt-dots">${q.pairs.map((_, k) => `<i class="${k === tt.cur ? 'cur' : v[k] ? 'done' : ''}"></i>`).join('')}</span></div>
    <div class="tt-pair${animate ? ' enter' : ''}" data-pair="${tt.cur}">
      ${['a', 'b'].map((side, k) => `${k ? '<span class="tt-or" aria-hidden="true">ou</span>' : ''}
        <button class="tt-opt tt-${side}${v[tt.cur] === side ? ' is-sel' : ''}" data-side="${side}" aria-pressed="${v[tt.cur] === side}">
          <span class="tt-l">${side.toUpperCase()}</span><b>${p[side].label}</b></button>`).join('')}
    </div>
    <ol class="tt-done" aria-label="Suas escolhas">${q.pairs.map((pp, k) => `
      <li><button class="${k === tt.cur ? 'cur' : ''}${v[k] ? ' ok' : ''}" data-goto="${k}"><small>${pp.short}</small>${v[k] ? pp[v[k]].label : '…'}</button></li>`).join('')}</ol>`;
}
(function setupTT() {
  const slide = $('.slide[data-id="estilo"]');
  const v = ttValue();
  tt.cur = Math.max(0, v.findIndex(s => !s));
  if (v.every(Boolean)) tt.cur = 0;
  renderTT(slide);
  $('[data-opts]', slide).addEventListener('click', e => {
    const opt = e.target.closest('[data-side]'), go = e.target.closest('[data-goto]');
    if (go) { tt.cur = Number(go.dataset.goto); renderTT(slide, true); return; }
    if (!opt) return;
    const q = byId('estilo');
    const val = ttValue();
    val[tt.cur] = opt.dataset.side;
    state.local.estilo = val;
    saveLocal();
    if (navigator.vibrate && state.fluid) navigator.vibrate(12);
    renderTT(slide);
    $(`.tt-opt[data-side="${opt.dataset.side}"]`, slide)?.classList.add('pop');
    const nextOpen = val.findIndex((s, k) => !s && k !== tt.cur);
    clearTimeout(tt.timer);
    if (nextOpen >= 0) {
      tt.timer = setTimeout(() => { tt.cur = nextOpen; renderTT(slide, true); }, reduced ? 0 : 480);
    } else {
      feedback(slide, true);
      save(q.id);
    }
  });
})();

/* ---------- hélice do DNA ---------- */
function helixSVG() {
  const W = 660, H = 150, mid = 75, A = 52, P = 220;
  const path = sign => {
    let d = '';
    for (let x = 0; x <= W; x += 4) d += `${x ? 'L' : 'M'}${x} ${(mid + sign * A * Math.sin(2 * Math.PI * x / P)).toFixed(1)}`;
    return d;
  };
  let rungs = '';
  for (let x = 8; x < W; x += 15) {
    const s = Math.sin(2 * Math.PI * x / P);
    if (Math.abs(s) < .2) continue;
    rungs += `<line class="rung" x1="${x}" x2="${x}" y1="${(mid + A * s).toFixed(1)}" y2="${(mid - A * s).toFixed(1)}" opacity="${(Math.abs(s) * .9).toFixed(2)}"/>`;
  }
  const nodes = [1, 3, 5].map((k, j) => {
    const x = (k * P / 2).toFixed(1);
    return `<circle class="halo" data-halo="${j}" cx="${x}" cy="${mid}" r="15"/><circle class="node" data-node="${j}" cx="${x}" cy="${mid}" r="14"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${rungs}<path class="strand s2" d="${path(-1)}"/><path class="strand s1" d="${path(1)}"/><path class="strand flow" d="${path(1)}" stroke="#ffffff" stroke-opacity=".6"/>${nodes}</svg>`;
}
$('[data-helix]', $('.slide[data-id="dna"]')).innerHTML = helixSVG();

function paintDna(slide, arr) {
  const q = byId('dna');
  $$('.dna-slots li', slide).forEach((li, j) => {
    const id = arr[j];
    const was = li.classList.contains('on');
    li.classList.toggle('on', !!id);
    $('b', li).textContent = id ? q.options.find(o => o.id === id).label : '—';
    const node = $(`[data-node="${j}"]`, slide), halo = $(`[data-halo="${j}"]`, slide);
    node?.classList.toggle('on', !!id);
    if (id && !was && halo) { halo.classList.remove('on'); void halo.getBBox(); halo.classList.add('on'); }
  });
}

qSlides.forEach(s => { paintSelection(s); feedback(s, false); });

/* ======================================================================
   SALVAMENTO AUTOMÁTICO
   ====================================================================== */
const saveTimers = {};
function save(qid, force) {
  const q = byId(qid);
  const v = normalize(q, state.local[qid]);
  // pergunta de múltipla escolha esvaziada: apaga a resposta anterior no servidor
  const value = v === undefined ? (q.type === 'multi' && state.sent[sentKey(qid)] ? null : undefined) : v;
  clearTimeout(saveTimers[qid]);
  if (value === undefined) { updateNav(); return; }
  if (!force && state.sent[sentKey(qid)] === JSON.stringify(value)) { state.status[qid] = 'saved'; updateNav(); return; }
  state.status[qid] = 'saving';
  updateNav();
  saveTimers[qid] = setTimeout(async () => {
    const r = await api.vote({ session: SESSION, pid: PID, qid, value, name: state.me.name || '', role: state.me.role || '' });
    if (r.ok) {
      if (value === null) delete state.sent[sentKey(qid)];
      else state.sent[sentKey(qid)] = JSON.stringify(value);
      LS.set('maia-sent', state.sent);
      state.status[qid] = 'saved';
    } else state.status[qid] = r.queued ? 'queued' : 'error';
    updateNav();
    if (slides[state.i]?.dataset.id === 'recap') renderRecap(slides[state.i]);
  }, 450);
}
// perfil mudou: reenvia as respostas já dadas com o perfil atualizado
function resendAll() { QUESTIONS.forEach(q => { if (answered(q.id)) save(q.id, true); }); }

/* ======================================================================
   LÂMINA 03 · PERFIL
   ====================================================================== */
const ROLE_ICON = { socio: 'star', colaborador: 'users', outro: 'user' };
const profileSlide = $('.slide[data-id="perfil"]');
function paintProfile() {
  $('[data-roles]', profileSlide).innerHTML = ROLES.map(r => `
    <button class="pf-role${state.me.role === r.id ? ' is-sel' : ''}" data-role="${r.id}" aria-pressed="${state.me.role === r.id}">${icon(ROLE_ICON[r.id] || 'user')}<span>${r.label}</span></button>`).join('');
}
paintProfile();
$('#pf-name').value = state.me.name || '';
$('[data-roles]', profileSlide).addEventListener('click', e => {
  const b = e.target.closest('[data-role]');
  if (!b) return;
  state.me.role = b.dataset.role;
  LS.set('maia-me', state.me);
  paintProfile();
  updateNav();
  resendAll();
});
let nameTimer;
$('#pf-name').addEventListener('input', e => {
  state.me.name = e.target.value.trim().slice(0, 60);
  LS.set('maia-me', state.me);
  clearTimeout(nameTimer);
  nameTimer = setTimeout(resendAll, 1200);
});
$('#pf-name').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); next(); } });

/* ======================================================================
   LÂMINA 08 · RESUMO ANTES DA REVELAÇÃO
   ====================================================================== */
function renderPauseRecap(slide) {
  $('[data-recap-pre]', slide).innerHTML = ['papel', 'tom', 'dna'].map(id => {
    const q = byId(id), has = answered(id);
    return `<span class="pr-chip${has ? '' : ' empty'}"><small>${q.short}</small><b>${has ? esc(answerLabel(q, state.local[id])) : 'a definir'}</b></span>`;
  }).join('');
}

/* ======================================================================
   LÂMINA 10 · PONTOS DE DETALHE
   ====================================================================== */
const HOTS = {
  cabelo: ['det-cabelo', 'Cabelo crespo natural', 'Volume, textura e liberdade de penteado.'],
  blazer: ['det-blazer', 'Blazer azul-marinho', 'Profissional, sem parecer formal demais.'],
  punho: ['det-tecido', 'Punho teal', 'A paleta da UORT aparece nos detalhes.'],
  tenis: ['det-tenis', 'Tênis branco', 'Conforto para quem vive em movimento.'],
};
(function setupHotspots() {
  const slide = $('.slide[data-id="quem"]');
  const figs = $('.who-figs', slide);
  const card = $('[data-hotcard]', slide);
  let pinned = null;
  function show(btn) {
    const [img, title, text] = HOTS[btn.dataset.hot];
    $('img', card).src = `assets/maia/${img}.webp`;
    $('b', card).textContent = title;
    $('small', card).textContent = text;
    card.hidden = false;
    const s = state.fluid ? 1 : state.scale || 1;
    const fr = figs.getBoundingClientRect(), br = btn.getBoundingClientRect();
    const W = figs.offsetWidth, H = figs.offsetHeight, cw = card.offsetWidth, ch = card.offsetHeight;
    const x = (br.left - fr.left) / s + 34, y = (br.top - fr.top) / s - 50;
    card.style.left = Math.max(10, Math.min(x, W - cw - 10)) + 'px';
    card.style.top = Math.max(10, Math.min(y, H - ch - 10)) + 'px';
    $$('.hot', slide).forEach(h => h.classList.toggle('on', h === btn));
  }
  function hide() { if (pinned) return; card.hidden = true; $$('.hot', slide).forEach(h => h.classList.remove('on')); }
  $$('.hot', slide).forEach(btn => {
    btn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') show(btn); });
    btn.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
    btn.addEventListener('focus', () => show(btn));
    btn.addEventListener('blur', hide);
    btn.addEventListener('click', () => { pinned = pinned === btn ? null : btn; if (pinned) show(btn); else hide(); });
  });
  slide._reset = () => { pinned = null; hide(); };
})();

/* ======================================================================
   LÂMINA 13 · IMAGEM AMPLIADA
   ====================================================================== */
$$('.s-sit .b:not(.ph)').forEach(fig => {
  fig.tabIndex = 0;
  fig.setAttribute('role', 'button');
  const open = () => {
    const img = $('img', fig);
    $('#lb-img').src = img.src;
    $('#lb-img').alt = img.alt;
    $('#lb-cap').textContent = `${$('figcaption b', fig).textContent} · ${$('figcaption span', fig).textContent}`;
    $('#lightbox').showModal();
  };
  fig.addEventListener('click', open);
  fig.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); open(); } });
});

/* ======================================================================
   LÂMINA 16 · COMO VIRA CONTEÚDO
   ====================================================================== */
const THEMES = [
  { q: 'Seu joelho reclama ao subir escadas?', img: 'post-escada', pos: '50% 16%', esp: 'Especialista em joelho', cta: 'Agende uma avaliação com um especialista em joelho.' },
  { q: 'Dor no ombro depois do treino?', img: 'post-ombro', pos: '50% 30%', esp: 'Especialista em ombro', cta: 'Converse com um especialista em ombro da UORT.' },
  { q: 'Quando procurar o Pronto Atendimento?', img: 'g-orienta', pos: '50% 25%', esp: 'Equipe do Pronto Atendimento', cta: 'Entenda quando ir ao Pronto Atendimento UORT.' },
  { q: 'Caiu no fim de semana. E agora?', img: 'p-atenta', pos: '50% 30%', esp: 'Ortopedista da UORT', cta: 'Saiba quando uma queda pede avaliação.' },
  { q: 'Onde dói?', img: 'g-conversa', pos: '50% 30%', esp: 'Especialistas UORT', cta: 'Descubra qual especialidade cuida de cada região do corpo.' },
  { q: 'Conheça os especialistas da UORT.', img: 'p-proxima', pos: '50% 30%', esp: 'Corpo clínico UORT', cta: 'Conheça quem cuida de você em todas as fases do movimento.' },
];
const CT_STEPS = ['Maia pergunta', 'Especialista explica', 'Próximo passo'];
const ct = { slide: $('.slide[data-id="conteudo"]'), theme: 0, frame: 0, timer: null, pauseUntil: 0 };

function phoneHTML(t) {
  return `<div class="ph-screen">
    <div class="ph-top"><span class="ph-av"><svg viewBox="0 0 64 64"><path d="M18 12v22a14 14 0 0 0 28 0V12" fill="none" stroke="#35e8f2" stroke-width="8"/></svg></span><span><b>uort</b><small>Ortopedia e Traumatologia</small></span></div>
    <div class="ph-post"><div class="ph-frames">
      <div class="ph-frame pf-1"><img class="pf-bg" src="assets/maia/${t.img}.webp" alt="" style="--pos:${t.pos}"><span class="pf-tag">Maia pergunta</span><img class="pf-logo" src="assets/brand/uort-white.png" alt=""><p class="pf-q">${t.q}</p></div>
      <div class="ph-frame pf-2"><span class="pf-k">O especialista responde</span><span class="pf-ic">${icon('steth')}</span><p>Aqui entra a orientação de um especialista da UORT, com linguagem clara e responsável.</p><div class="pf-sign"><b>Dr(a). Nome Sobrenome</b><small>${t.esp} · CRM (inserir)</small></div></div>
      <div class="ph-frame pf-3"><span class="pf-k">Próximo passo</span><h4>${t.cta}</h4><span class="pf-btn">Agende sua avaliação<i>${icon('arrow-right')}</i></span><span class="pf-btn ghost">Fale com a UORT<i>${icon('whats')}</i></span><span class="logo-uort" role="img" aria-label="UORT"></span></div>
    </div></div>
    <div class="ph-bar">${icon('heart')}${icon('chat')}${icon('share')}<span class="ph-dots"><i></i><i></i><i></i></span></div>
    <p class="ph-cap"><b>uort</b> A Maia apresenta a dúvida. Quem explica é o especialista.</p>
  </div>`;
}
function ctPaint(themeChanged) {
  const s = ct.slide;
  if (themeChanged) $('[data-phone]', s).innerHTML = phoneHTML(THEMES[ct.theme]);
  $$('.th', s).forEach((b, k) => { b.classList.toggle('is-on', k === ct.theme); b.setAttribute('aria-pressed', String(k === ct.theme)); });
  const frames = $('.ph-frames', s);
  if (frames) frames.style.setProperty('--f', ct.frame);
  $$('.ph-dots i', s).forEach((d, k) => d.classList.toggle('on', k === ct.frame));
  $$('.cs', s).forEach((b, k) => {
    b.classList.toggle('on', k === ct.frame);
    if (k === ct.frame) { b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
  });
}
(function setupContent() {
  const s = ct.slide;
  $('[data-themes]', s).innerHTML = THEMES.map((t, k) => `
    <button class="th" data-th="${k}" aria-pressed="false" data-anim="up" style="--d:${(.25 + k * .07).toFixed(2)}s"><img src="assets/maia/${t.img}.webp" alt="" style="--pos:${t.pos}" ${lazy}><span><b>${t.q}</b><small>${t.esp}</small></span></button>`).join('');
  $('[data-ctsteps]', s).innerHTML = CT_STEPS.map((t, k) => `<button class="cs" data-cs="${k}" style="--dur:4.2s"><i>${k + 1}</i>${t}</button>`).join('');
  s.addEventListener('click', e => {
    const th = e.target.closest('[data-th]'), cs = e.target.closest('[data-cs]');
    if (th) {
      ct.theme = Number(th.dataset.th); ct.frame = 0; ct.pauseUntil = 0; ctPaint(true);
      if (state.fluid) revealInSlide(s, $('[data-phone]', s));
    }
    if (cs) { ct.frame = Number(cs.dataset.cs); ct.pauseUntil = Date.now() + 9000; ctPaint(false); }
    $('[data-ctsteps]', s).classList.toggle('paused', Date.now() < ct.pauseUntil);
  });
  // deslizar no próprio post troca o quadro do carrossel
  let sx = null;
  $('[data-phone]', s).addEventListener('pointerdown', e => { sx = e.clientX; });
  $('[data-phone]', s).addEventListener('pointerup', e => {
    if (sx == null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) < 40) return;
    ct.frame = Math.max(0, Math.min(2, ct.frame + (dx < 0 ? 1 : -1)));
    ct.pauseUntil = Date.now() + 9000; ctPaint(false);
  });
  ctPaint(true);
})();
function ctStart() {
  ctStop();
  ct.frame = 0; ctPaint(false);
  ct.timer = setInterval(() => {
    if (Date.now() < ct.pauseUntil || document.hidden) return;
    $('[data-ctsteps]', ct.slide).classList.remove('paused');
    ct.frame = (ct.frame + 1) % 3;
    if (ct.frame === 0) { ct.theme = (ct.theme + 1) % THEMES.length; ctPaint(true); } else ctPaint(false);
  }, 4200);
}
function ctStop() { clearInterval(ct.timer); ct.timer = null; }

/* ======================================================================
   LÂMINA 18 · SUAS ESCOLHAS
   ====================================================================== */
function renderRecap(slide) {
  const done = QUESTIONS.filter(q => answered(q.id));
  const pending = done.filter(q => state.status[q.id] === 'saving' || state.status[q.id] === 'queued' || state.sent[sentKey(q.id)] !== JSON.stringify(normalize(q, state.local[q.id])));
  const st = $('[data-rc-status]', slide);
  if (done.length === QUESTIONS.length && !pending.length) {
    st.className = 'rc-status ok';
    st.innerHTML = `${icon('check')}<span><b>Suas ${QUESTIONS.length} escolhas foram registradas.</b> Obrigado! Se quiser, ainda dá para alterar.</span>`;
  } else if (pending.length && done.length === QUESTIONS.length) {
    st.className = 'rc-status wait';
    st.innerHTML = `${icon('refresh')}<span><b>Enviando suas respostas…</b> Se estiver sem internet, elas são enviadas assim que a conexão voltar.</span>`;
  } else {
    st.className = 'rc-status miss';
    st.innerHTML = `${icon('info')}<span>Você respondeu <b>${done.length} de ${QUESTIONS.length}</b>. Toque em <b>Responder</b> para completar as que faltam.</span>`;
  }
  $('[data-recap]', slide).innerHTML = QUESTIONS.map((q, k) => {
    const has = answered(q.id), v = state.local[q.id];
    const opt = q.type === 'single' && has ? q.options.find(o => o.id === v) : null;
    const img = opt?.img ? `<img class="rc-img" src="${opt.img}" alt="" style="--pos:${opt.pos || '50% 22%'}" ${lazy}>` : '';
    return `<article class="rc${has ? '' : ' empty'}${img ? ' has-img' : ''}" style="--i:${k}">
      ${img}<p class="rc-k">${q.n} · ${q.short}</p>
      <p class="rc-v">${has ? esc(answerLabel(q, v)) : 'Ainda não respondida'}</p>
      <button class="rc-edit" data-jump="${q.slide}">${has ? 'Alterar' : 'Responder'}${icon('arrow-right')}</button>
    </article>`;
  }).join('');
}
$('[data-recap]').addEventListener('click', e => {
  const b = e.target.closest('[data-jump]');
  if (!b) return;
  state.returnTo = recapIndex;
  go(indexOf(b.dataset.jump));
});

/* ======================================================================
   NAVEGAÇÃO
   ====================================================================== */
const maxStep = slide => Math.max(0, ...$$('[data-step]', slide).map(el => Number(el.dataset.step)));

function setStep(s, instant) {
  const slide = slides[state.i];
  s = Math.max(0, Math.min(maxStep(slide), s));
  const prev = state.step;
  if (s === prev && !instant) return;
  const flip = !instant && !reduced && slide.dataset.id === 'revelacao' && prev === 0 && s === 1
    ? $$('.maia-word span', slide).map(el => el.getBoundingClientRect()) : null;
  $$('[data-step]', slide).forEach(el => el.classList.toggle('is-on', Number(el.dataset.step) <= s));
  [...slide.classList].filter(c => c.startsWith('step-')).forEach(c => slide.classList.remove(c));
  slide.classList.add('step-' + s);
  state.step = s;
  if (flip) {
    // as letras do nome "viajam" até virar o acróstico M·A·I·A
    $$('.acro-l', slide).forEach((el, k) => {
      const a = flip[k], b = el.getBoundingClientRect(), sc = state.fluid ? 1 : state.scale || 1;
      el.animate([
        { transform: `translate(${(a.left - b.left) / sc}px, ${(a.top - b.top) / sc}px) scale(${a.height / b.height})` },
        { transform: 'none' },
      ], { duration: 1000, delay: k * 70, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' });
    });
  }
  // no celular, leva a tela até o que acabou de aparecer
  if (state.fluid && !instant && s > prev) {
    const el = $(`[data-step="${s}"]`, slide);
    if (el) setTimeout(() => (el.classList.contains('end-curtain') ? slide.scrollTo({ top: 0 }) : revealInSlide(slide, el)), 60);
  }
  if (slide.dataset.id === 'quem' && s === 0) slide._reset?.();
}

/** Rola a lâmina (só na vertical) até o elemento ficar visível. */
function revealInSlide(slide, el) {
  const sr = slide.getBoundingClientRect(), er = el.getBoundingClientRect();
  const top = er.top - sr.top + slide.scrollTop, bottom = top + er.height;
  let target = slide.scrollTop;
  if (bottom > slide.scrollTop + slide.clientHeight - 16) target = bottom - slide.clientHeight + 24;
  if (top < target + 16) target = top - 16;
  slide.scrollTo({ top: Math.max(0, target), left: 0, behavior: reduced ? 'auto' : 'smooth' });
}

function enter(slide) {
  slide.scrollTop = 0;
  slide.scrollLeft = 0;
  switch (slide.dataset.id) {
    case 'pausa': renderPauseRecap(slide); break;
    case 'recap': renderRecap(slide); break;
    case 'conteudo': ctStart(); break;
    case 'quem': slide._reset?.(); break;
  }
  if (slide.dataset.q) paintSelection(slide);
}
function leave(slide) {
  if (slide.dataset.id === 'conteudo') ctStop();
}

function activate(n, step) {
  const old = slides[state.i];
  if (old) { old.classList.remove('is-active'); leave(old); }
  state.i = n;
  const slide = slides[n];
  slide.classList.add('is-active');
  state.step = -1;
  setStep(step, true);
  enter(slide);
  updateChrome();
  warm(n);
  history.replaceState(null, '', location.pathname + location.search + '#' + (n + 1));
  LS.set('maia-pos', n);
}

// Posição "lógica" (atualizada na hora do clique). A renderização alcança essa posição
// assim que a transição em andamento termina — nenhum toque/clique se perde.
const pos = { i: -1, step: 0 };
let vtPending = false, vtId = 0;

function render() {
  if (vtPending) return;
  if (pos.i === state.i) { setStep(pos.step); updateChrome(); return; }
  const from = state.i;
  const update = () => { activate(pos.i, pos.step); };
  if (from < 0 || reduced || !document.startViewTransition) { update(); return; }
  const reveal = slides[from].dataset.id === 'pausa' && slides[pos.i].dataset.id === SETTINGS.revealSlide;
  const id = ++vtId;
  document.documentElement.dataset.vt = reveal ? 'reveal' : pos.i > from ? 'forward' : 'backward';
  vtPending = true;
  const vt = document.startViewTransition(update);
  vt.ready.catch(() => {}); // transição pulada por um toque rápido: não é erro
  vt.updateCallbackDone.catch(() => {}).finally(() => {
    vtPending = false;
    if (pos.i !== state.i || pos.step !== state.step) render();
  });
  vt.finished.catch(() => {}).finally(() => { if (id === vtId) delete document.documentElement.dataset.vt; });
}
function go(n, step = 0) {
  pos.i = Math.max(0, Math.min(slides.length - 1, n));
  pos.step = Math.max(0, Math.min(maxStep(slides[pos.i]), step));
  render();
}
function next() {
  const slide = slides[pos.i];
  if (slide.dataset.id === 'perfil' && !state.me.role) {
    const roles = $('[data-roles]', slide);
    roles.classList.remove('shake'); void roles.offsetWidth; roles.classList.add('shake');
    toast('Antes de continuar, conte como você participa da UORT.');
    return;
  }
  if (pos.step < maxStep(slide)) { pos.step++; render(); return; }
  if (state.returnTo != null && slide.dataset.q) { const r = state.returnTo; state.returnTo = null; go(r); return; }
  if (pos.i < slides.length - 1) go(pos.i + 1);
}
function prev() {
  if (pos.step > 0) { pos.step--; render(); }
  else if (pos.i > 0) go(pos.i - 1, maxStep(slides[pos.i - 1]));
}

/* ---------- barra de progresso, sumário e moldura ---------- */
const progress = $('#progress');
progress.innerHTML = slides.map((s, k) => {
  const chStart = k > 0 && s.dataset.chapter !== slides[k - 1].dataset.chapter;
  return `<span class="seg${chStart ? ' ch-start' : ''}${s.dataset.q ? ' is-q' : ''}" data-go="${k}" title="${pad(k + 1)} · ${esc(s.dataset.title)}"></span>`;
}).join('');
progress.addEventListener('click', e => { const seg = e.target.closest('[data-go]'); if (seg && !state.fluid) go(Number(seg.dataset.go)); });
$('#bb-n').textContent = pad(slides.length);

function buildToc() {
  let html = '', ch = null;
  slides.forEach((s, k) => {
    if (s.dataset.chapter !== ch) { ch = s.dataset.chapter; html += `<p class="toc-ch">${CHAPTERS[ch]}</p>`; }
    const q = s.dataset.q;
    const tag = q ? (answered(q) ? `<span class="tag ok">${icon('check')}Respondida</span>` : '<span class="tag">Escolha</span>') : '';
    // antes da revelação, o sumário não entrega o nome
    const title = state.i < revealIndex && k >= revealIndex ? 'Continua…' : s.dataset.title;
    html += `<button class="toc-item${k === state.i ? ' cur' : ''}" data-go="${k}"><b>${pad(k + 1)}</b>${esc(title)}${tag}</button>`;
  });
  $('#toc-list').innerHTML = html;
}
$('#toc-list').addEventListener('click', e => {
  const b = e.target.closest('[data-go]');
  if (!b) return;
  $('#toc').close();
  go(Number(b.dataset.go));
});

const chapterOrder = Object.keys(CHAPTERS);
function updateChrome() {
  const s = slides[state.i];
  $('#tb-num').textContent = pad(chapterOrder.indexOf(s.dataset.chapter) + 1);
  $('#tb-title').textContent = CHAPTERS[s.dataset.chapter];
  $('#tb-count').textContent = `${pad(state.i + 1)}/${pad(slides.length)}`;
  $('#bb-i').textContent = pad(state.i + 1);
  $('#bb-title').textContent = s.dataset.title;
  $$('.seg', progress).forEach((seg, k) => {
    seg.classList.toggle('done', k < state.i);
    seg.classList.toggle('cur', k === state.i);
    if (slides[k].dataset.q) seg.classList.toggle('ans', answered(slides[k].dataset.q));
  });
  $$('[data-act="prev"]').forEach(b => { b.disabled = state.i === 0 && state.step === 0; });
  document.title = state.i >= revealIndex ? 'Maia · UORT' : 'UORT · Uma nova integrante';
  updateNav();
}

/* rótulo do botão principal + situação do salvamento */
function updateNav() {
  const s = slides[state.i];
  if (!s) return;
  const q = s.dataset.q ? byId(s.dataset.q) : null;
  const last = state.i === slides.length - 1 && state.step >= maxStep(s);
  const btn = $('#btn-next'), label = $('#next-label'), info = $('#bb-save');
  let text = 'Próxima', ghost = false;
  if (s.dataset.id === 'perfil') { text = state.me.role ? 'Começar' : 'Continuar'; ghost = !state.me.role; }
  else if (q) {
    if (!answered(q.id)) { text = 'Pular'; ghost = true; }
    else if (state.returnTo != null) text = 'Voltar ao resumo';
  } else if (s.dataset.id === 'pausa' && state.step < maxStep(s)) text = 'Continuar';
  else if (s.dataset.id === 'recap') text = 'Finalizar';
  if (last) text = 'Concluído';
  label.textContent = text;
  btn.classList.toggle('ghost', ghost);
  btn.disabled = last;
  $$('.side-next').forEach(b => { b.disabled = last; });

  let msg = '', cls = '';
  if (q && answered(q.id)) {
    const st = state.status[q.id] || (state.sent[sentKey(q.id)] === JSON.stringify(normalize(q, state.local[q.id])) ? 'saved' : '');
    if (st === 'saving') { msg = 'Salvando…'; cls = 'wait'; }
    else if (st === 'saved') { msg = `${icon('check')}Resposta salva`; cls = 'ok'; }
    else if (st === 'queued') { msg = 'Sem conexão: vamos reenviar'; cls = 'warn'; }
    else if (st === 'error') { msg = 'Não foi possível salvar'; cls = 'warn'; }
  } else if (q && q.type === 'pairs') {
    const n = ttValue().filter(Boolean).length;
    if (n) { msg = `${n} de ${q.pairs.length}`; cls = 'wait'; }
  }
  info.className = 'bb-save ' + cls;
  info.innerHTML = msg;
}

/* ---------- modo celular × palco 16:9 ---------- */
const fluidMQ = matchMedia('(max-width: 1179px), (max-height: 559px), (orientation: portrait)');
function applyMode() {
  state.fluid = fluidMQ.matches;
  document.documentElement.classList.toggle('fluid', state.fluid);
  $$('.deco', stage).forEach(d => d.setAttribute('preserveAspectRatio', state.fluid ? 'xMidYMin slice' : 'none'));
  fit();
}
function fit() {
  if (state.fluid) { stage.style.removeProperty('--s'); state.scale = 1; return; }
  const r = frame.getBoundingClientRect();
  const full = document.body.classList.contains('is-full');
  const padX = full ? 0 : 70;
  const padY = full ? 0 : 4;
  state.scale = Math.max(.05, Math.min((r.width - padX * 2) / 1920, (r.height - padY * 2) / 1080));
  stage.style.setProperty('--s', state.scale);
}
fluidMQ.addEventListener('change', applyMode);
new ResizeObserver(fit).observe(frame);

/* ---------- tela cheia e cursor ---------- */
function toggleFull() {
  if (document.fullscreenElement) { document.exitFullscreen(); return; }
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => document.body.classList.toggle('is-full'));
  } else document.body.classList.toggle('is-full');
}
document.addEventListener('fullscreenchange', () => {
  document.body.classList.toggle('is-full', !!document.fullscreenElement);
  requestAnimationFrame(fit);
});
let idleTimer;
addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  document.body.classList.remove('is-idle');
  clearTimeout(idleTimer);
  if (document.body.classList.contains('is-full')) idleTimer = setTimeout(() => document.body.classList.add('is-idle'), 2500);
});

/* ======================================================================
   ENTRADAS: cliques, teclado, gestos
   ====================================================================== */
$$('dialog').forEach(d => {
  d.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === d) d.close(); });
});
const ACTIONS = {
  next, prev,
  toc: () => { buildToc(); $('#toc').showModal(); },
  full: toggleFull,
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (b && ACTIONS[b.dataset.act]) { e.preventDefault(); ACTIONS[b.dataset.act](); }
});

addEventListener('keydown', e => {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
  if ($$('dialog[open]').length) return;
  const t = e.target;
  if (t.matches?.('input, textarea, select')) return;
  const k = e.key;
  if ((k === ' ' || k === 'Enter') && t.closest?.('button')) return;
  switch (k) {
    case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); next(); break;
    case 'ArrowLeft': case 'PageUp': e.preventDefault(); prev(); break;
    case 'ArrowDown': case 'ArrowUp': if (!state.fluid) { e.preventDefault(); (k === 'ArrowDown' ? next : prev)(); } break;
    case 'Home': e.preventDefault(); go(0); break;
    case 'End': e.preventDefault(); go(slides.length - 1); break;
    case 'f': case 'F': if (!state.fluid) toggleFull(); break;
    case 's': case 'S': ACTIONS.toc(); break;
    case 'Escape': if (document.body.classList.contains('is-full') && !document.fullscreenElement) { document.body.classList.remove('is-full'); fit(); } break;
  }
});

// deslizar para os lados troca de lâmina (rolar para cima/baixo continua rolando a lâmina)
let swipe = null;
frame.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' || e.target.closest('input, a, [data-phone], .tt, .hot')) return;
  swipe = { x: e.clientX, y: e.clientY, t: Date.now() };
});
frame.addEventListener('pointercancel', () => { swipe = null; });
frame.addEventListener('pointerup', e => {
  if (!swipe) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y, dt = Date.now() - swipe.t;
  swipe = null;
  if (dt < 700 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) (dx < 0 ? next : prev)();
});

addEventListener('hashchange', () => {
  const n = parseInt(location.hash.slice(1), 10) - 1;
  if (n >= 0 && n !== pos.i) go(n);
});
addEventListener('online', () => flushQueue().then(() => QUESTIONS.forEach(q => { if (state.status[q.id] === 'queued') save(q.id, true); })));

/* ======================================================================
   INÍCIO
   ====================================================================== */
applyMode();
const fromHash = parseInt(location.hash.slice(1), 10) - 1;
const resume = LS.get('maia-pos', 0);
if (Number.isFinite(fromHash) && fromHash >= 0) go(fromHash);
else if (resume > 0 && resume < slides.length) { go(resume); setTimeout(() => toast('Continuando de onde você parou.'), 600); }
else go(0);

// respostas que ficaram pendentes em outra visita
flushQueue().then(() => QUESTIONS.forEach(q => { if (answered(q.id) && state.sent[sentKey(q.id)] !== JSON.stringify(normalize(q, state.local[q.id]))) save(q.id); }));
