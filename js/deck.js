/* ==========================================================================
   PERSONAGENS · UORT — motor da apresentação + questionário
   Cada pessoa abre o link, percorre as lâminas e responde ali mesmo.
   As respostas são salvas automaticamente (/api/vote); o resultado só
   aparece no painel da equipe (/resultados).
   No computador: palco 16:9 escalado. No celular/tablet em pé: layout
   vertical que rola (classe .fluid no <html>).
   ========================================================================== */
import { QUESTIONS, SETTINGS, byId, normalize, answerLabel, applies } from './config.js';
import { injectIcons, icon } from './icons.js';
import { api, LS, participantId, flushQueue } from './client.js';

injectIcons();

// questionário novo: aparelhos que abriram a versão anterior começam do zero
if (LS.get('maia-v', 1) !== SETTINGS.version) {
  ['maia-local', 'maia-me', 'maia-sent', 'maia-pos', 'maia-queue'].forEach(LS.del);
  LS.set('maia-v', SETTINGS.version);
}

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
const CHAPTERS = { chegada: 'Chegada', dna: 'O DNA', revelacao: 'Revelação', ela: 'Proposta A', ele: 'Proposta B', escolha: 'A escolha', presenca: 'Presença', fechamento: 'Fechamento' };

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
  me: LS.get('maia-me', { name: '' }),             // nome de quem responde
  sent: LS.get('maia-sent', {}),                   // o que já chegou ao servidor
  status: {},                                      // qid → saving | saved | queued | error
  returnTo: null,                                  // volta ao resumo depois de alterar
};
const saveLocal = () => LS.set('maia-local', state.local);
const sentKey = qid => `${SESSION}:${qid}`;
const valueArray = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
const answered = qid => normalize(byId(qid), state.local[qid]) !== undefined;
// só uma proposta segue: perguntas e lâminas com "when" dependem da escolha (data-when="personagem:ela")
const applicable = q => applies(q, state.local);
const activeQs = () => QUESTIONS.filter(applicable);
const isOn = slide => { const w = slide.dataset.when; if (!w) return true; const [k, v] = w.split(':'); return state.local[k] === v; };
const visible = () => slides.filter(isOn);
/** Próxima lâmina visível a partir de n, andando para frente (dir 1) ou para trás (dir -1). */
function nextOn(n, dir = 1) { for (let k = n; k >= 0 && k < slides.length; k += dir) if (isOn(slides[k])) return k; return -1; }

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
slides.forEach(s => {
  const d = DECO[s.dataset.deco];
  if (d) s.insertAdjacentHTML('afterbegin', `<svg class="deco" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-hidden="true">${d}</svg>`);
  const foot = $('.sl-foot', s);
  if (foot) foot.insertAdjacentHTML('beforeend', '<span class="pg"></span>'); // preenchido em layout()
  $$('img', s).forEach(img => { img.decoding = 'async'; });
});
// pré-carrega as imagens das próximas lâminas (as demais chegam sob demanda)
function warm(k) {
  [k + 1, k + 2].forEach(n => slides[n] && $$('img', slides[n]).forEach(img => {
    if (!img.complete && !img.dataset.warm) { img.dataset.warm = '1'; new Image().src = img.currentSrc || img.src; }
  }));
  [k + 1, k + 2].forEach(n => slides[n] && primeVideos(slides[n]));
}

/* vídeos: só baixam perto da lâmina; sem animação ou com economia de dados, fica a capa (poster) */
const noVideo = reduced || navigator.connection?.saveData;
function primeVideos(slide) {
  if (noVideo) return;
  $$('video[data-video]', slide).forEach(v => {
    if (v.dataset.ready) return;
    v.dataset.ready = '1';
    $$('source[data-src]', v).forEach(src => { src.src = src.dataset.src; });
    v.preload = 'auto';
    v.load();
  });
}
function playVideos(slide) {
  primeVideos(slide);
  if (noVideo) return;
  // ainda carregando ou aba em segundo plano: tenta de novo quando der; enquanto isso, a capa continua visível
  $$('video[data-video]', slide).forEach(v => v.play().catch(() => v.addEventListener('canplay', () => {
    if (slide.classList.contains('is-active')) v.play().catch(() => {});
  }, { once: true })));
}
const pauseVideos = slide => $$('video[data-video]', slide).forEach(v => v.pause());
document.addEventListener('visibilitychange', () => { if (!document.hidden && slides[state.i]) playVideos(slides[state.i]); });

/* ======================================================================
   OPÇÕES DAS PERGUNTAS (geradas a partir de config.js)
   ====================================================================== */
const CHECK = `<span class="opt-check" aria-hidden="true">${icon('check')}</span>`;
const lazy = 'loading="lazy" decoding="async"';

// cartão de nome: letra do acróstico ou ícone + ideia por trás do nome
const nameCards = q => q.options.map((o, k) => `
    <button class="nm opt" data-v="${o.id}" aria-pressed="false">
      <span class="nm-k">Opção ${'AB'[k]}</span>
      <b class="nm-name">${o.label}</b>
      <span class="nm-idea">${o.idea}</span>
      <span class="nm-rows">${o.rows.map(([m, t, d]) => `
        <span class="nm-row"><span class="nm-m${m.length > 1 ? ' is-ic' : ''}">${m.length > 1 ? icon(m) : m}</span><span class="nm-tx"><strong>${t}</strong><small>${d}</small></span></span>`).join('')}
      </span>${CHECK}
    </button>`).join('');

const RENDER = {
  personagem: q => q.options.map(o => `
    <button class="pick opt" data-v="${o.id}" aria-pressed="false">
      <span class="pick-img"><img src="${o.img}" alt="" style="--pos:${o.pos || '50% 15%'}" ${lazy}></span>
      <span class="pick-tx"><span class="pick-k">${o.tag}</span><b class="pick-name">${o.label}</b><span class="pick-d">${o.desc}</span><span class="pick-cta">Escolher<span class="pick-more"> esta proposta</span></span></span>${CHECK}
    </button>`).join(''),
  dna: q => q.options.map(o => `
    <button class="trait opt" data-v="${o.id}" aria-pressed="false"><span class="tr-mark">${icon('plus')}</span>${o.label}</button>`).join(''),
  'nome-ela': nameCards,
  'nome-ele': nameCards,
  // só a proposta escolhida (as duas, uma sobre a outra, se a pessoa ainda não escolheu)
  versao: q => q.options.map(o => `
    <button class="ver opt" data-v="${o.id}" aria-pressed="false">
      <span class="ver-imgs">${[state.local.personagem !== 'ele' && [o.img, o.pos], state.local.personagem !== 'ela' && [o.img2, o.pos2]].filter(Boolean)
        .map(([src, p]) => `<img src="${src}" alt="" style="--pos:${p || '50% 20%'}" ${lazy}>`).join('')}</span><span class="ver-shade"></span>
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
};

const qSlides = slides.filter(s => s.dataset.q);
function renderOpts(slide) {
  const q = byId(slide.dataset.q);
  $('[data-opts]', slide).innerHTML = RENDER[q.id](q);
  if (q.id === 'versao') $('[data-opts]', slide).classList.toggle('solo', !!state.local.personagem);
}
qSlides.forEach(renderOpts);

/* ---------- seleção ---------- */
function paintSelection(slide) {
  const q = byId(slide.dataset.q);
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
  const n = valueArray(state.local[q.id]).length;
  const show = q.id === 'dna' ? n >= q.max : n > 0;
  if (animate && show) { fb.classList.remove('show'); void fb.offsetWidth; }
  fb.classList.toggle('show', show);
}

function choose(slide, v) {
  const q = byId(slide.dataset.q);
  const before = state.local[q.id];
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
  if (q.id === 'personagem' && before !== v) changedPersonagem();
}

/* trocou de proposta: apaga as respostas que só valiam para a outra e refaz a sequência */
function changedPersonagem() {
  QUESTIONS.forEach(x => { if (!applicable(x) && x.id in state.local) { delete state.local[x.id]; save(x.id); } });
  saveLocal();
  state.returnTo = null; // segue para o nome da proposta escolhida, mesmo vindo do resumo
  renderOpts($('.slide[data-id="versoes"]'));
  paintSelection($('.slide[data-id="versoes"]'));
  layout();
}

stage.addEventListener('click', e => {
  const opt = e.target.closest('.opt');
  if (!opt) return;
  const slide = opt.closest('.slide');
  if (slide?.dataset.q) choose(slide, opt.dataset.v);
});

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
  // resposta apagada (desmarcou tudo ou trocou de proposta): apaga também no servidor
  const value = v === undefined ? (state.sent[sentKey(qid)] ? null : undefined) : v;
  clearTimeout(saveTimers[qid]);
  if (value === undefined) { updateNav(); return; }
  if (!force && state.sent[sentKey(qid)] === JSON.stringify(value)) { state.status[qid] = 'saved'; updateNav(); return; }
  state.status[qid] = 'saving';
  updateNav();
  saveTimers[qid] = setTimeout(async () => {
    const r = await api.vote({ session: SESSION, pid: PID, qid, value, name: state.me.name || '' });
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
// nome mudou: reenvia as respostas já dadas com o nome atualizado
function resendAll() { QUESTIONS.forEach(q => { if (answered(q.id)) save(q.id, true); }); }

/* ======================================================================
   LÂMINA 03 · NOME DE QUEM RESPONDE
   ====================================================================== */
const nameInput = $('#pf-name');
nameInput.value = state.me.name || '';
let nameTimer;
nameInput.addEventListener('input', e => {
  state.me.name = e.target.value.trim().slice(0, 60);
  LS.set('maia-me', state.me);
  updateNav();
  clearTimeout(nameTimer);
  nameTimer = setTimeout(resendAll, 1200);
});
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); next(); } });

/* ======================================================================
   LÂMINA 05 · RESUMO ANTES DA REVELAÇÃO
   ====================================================================== */
function renderPauseRecap(slide) {
  const q = byId('dna'), arr = valueArray(state.local.dna);
  $('[data-recap-pre]', slide).innerHTML = Array.from({ length: q.max }, (_, k) => {
    const o = q.options.find(x => x.id === arr[k]);
    return `<span class="pr-chip${o ? '' : ' empty'}"><small>${pad(k + 1)}</small><b>${o ? esc(o.label) : 'a definir'}</b></span>`;
  }).join('');
}

/* ======================================================================
   LÂMINAS 07 E 08 · PONTOS DE DETALHE
   ====================================================================== */
const HOTS = {
  cabelo: ['maia/det-cabelo', 'Cabelo crespo natural', 'Volume, textura e liberdade de penteado.'],
  blazer: ['maia/det-blazer', 'Blazer azul-marinho', 'Profissional, sem parecer formal demais.'],
  punho: ['maia/det-tecido', 'Punho teal', 'A paleta da UORT aparece nos detalhes.'],
  tenis: ['maia/det-tenis', 'Tênis branco', 'Conforto para quem vive em movimento.'],
  barba: ['otto/det-cabelo', 'Barba e cabelo', 'Naturais e bem cuidados.'],
  jaqueta: ['otto/det-tecido', 'Jaqueta esportiva', 'Tecido leve, com detalhes em teal.'],
  relogio: ['otto/det-relogio', 'Smartwatch', 'Tecnologia no dia a dia.'],
  'tenis-ele': ['otto/det-tenis', 'Tênis esportivo', 'Conforto para quem vive em movimento.'],
};
$$('.s-who').forEach(function setupHotspots(slide) {
  const figs = $('.who-figs', slide);
  const card = $('[data-hotcard]', slide);
  let pinned = null;
  function show(btn) {
    const [img, title, text] = HOTS[btn.dataset.hot];
    $('img', card).src = `assets/${img}.webp`;
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
});

/* ======================================================================
   LÂMINA 16 · COMO VIRA CONTEÚDO
   ====================================================================== */
// who: quem faz a pergunta no post (ela | ele)
const THEMES = [
  { q: 'Seu joelho reclama ao subir escadas?', img: 'maia/sit-esporte', pos: '50% 18%', who: 'ela', esp: 'Especialista em joelho', cta: 'Agende uma avaliação com um especialista em joelho.' },
  { q: 'Quando procurar o Pronto Atendimento?', img: 'otto/celular', pos: '50% 22%', who: 'ele', esp: 'Equipe do Pronto Atendimento', cta: 'Entenda quando ir ao Pronto Atendimento UORT.' },
  { q: 'Dor no ombro depois do treino?', img: 'maia/post-ombro', pos: '50% 30%', who: 'ela', esp: 'Especialista em ombro', cta: 'Converse com um especialista em ombro da UORT.' },
  { q: 'Caiu no fim de semana. E agora?', img: 'otto/p-atento', pos: '50% 30%', who: 'ele', esp: 'Ortopedista da UORT', cta: 'Saiba quando uma queda pede avaliação.' },
  { q: 'Onde dói?', img: 'maia/p-comunicativa', pos: '45% 20%', who: 'ela', esp: 'Especialistas UORT', cta: 'Descubra qual especialidade cuida de cada região do corpo.' },
  { q: 'Conheça os especialistas da UORT.', img: 'otto/retrato', pos: '50% 22%', who: 'ele', esp: 'Corpo clínico UORT', cta: 'Conheça quem cuida de você em todas as fases do movimento.' },
];
const CT_STEPS = ['Personagem pergunta', 'Especialista explica', 'Próximo passo'];
const who = t => (t.who === 'ele' ? 'Ele' : 'Ela');
const ct = { slide: $('.slide[data-id="conteudo"]'), theme: 0, frame: 0, timer: null, pauseUntil: 0 };

function phoneHTML(t) {
  return `<div class="ph-screen">
    <div class="ph-top"><span class="ph-av"><svg viewBox="0 0 64 64"><path d="M18 12v22a14 14 0 0 0 28 0V12" fill="none" stroke="#35e8f2" stroke-width="8"/></svg></span><span><b>uort</b><small>Ortopedia e Traumatologia</small></span></div>
    <div class="ph-post"><div class="ph-frames">
      <div class="ph-frame pf-1"><img class="pf-bg" src="assets/${t.img}.webp" alt="" style="--pos:${t.pos}"><span class="pf-tag">${who(t)} pergunta</span><img class="pf-logo" src="assets/brand/uort-white.png" alt=""><p class="pf-q">${t.q}</p></div>
      <div class="ph-frame pf-2"><span class="pf-k">O especialista responde</span><span class="pf-ic">${icon('steth')}</span><p>Aqui entra a orientação de um especialista da UORT, com linguagem clara e responsável.</p><div class="pf-sign"><b>Dr(a). Nome Sobrenome</b><small>${t.esp} · CRM (inserir)</small></div></div>
      <div class="ph-frame pf-3"><span class="pf-k">Próximo passo</span><h4>${t.cta}</h4><span class="pf-btn">Agende sua avaliação<i>${icon('arrow-right')}</i></span><span class="pf-btn ghost">Fale com a UORT<i>${icon('whats')}</i></span><span class="logo-uort" role="img" aria-label="UORT"></span></div>
    </div></div>
    <div class="ph-bar">${icon('heart')}${icon('chat')}${icon('share')}<span class="ph-dots"><i></i><i></i><i></i></span></div>
    <p class="ph-cap"><b>uort</b> ${who(t)} apresenta a dúvida. Quem explica é o especialista.</p>
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
    <button class="th" data-th="${k}" aria-pressed="false" data-anim="up" style="--d:${(.25 + k * .07).toFixed(2)}s"><img src="assets/${t.img}.webp" alt="" style="--pos:${t.pos}" ${lazy}><span><b>${t.q}</b><small>${t.esp}</small></span></button>`).join('');
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
  const qs = activeQs();
  const done = qs.filter(q => answered(q.id));
  const pending = done.filter(q => state.status[q.id] === 'saving' || state.status[q.id] === 'queued' || state.sent[sentKey(q.id)] !== JSON.stringify(normalize(q, state.local[q.id])));
  const st = $('[data-rc-status]', slide);
  if (done.length === qs.length && !pending.length) {
    st.className = 'rc-status ok';
    st.innerHTML = `${icon('check')}<span><b>Suas ${qs.length} escolhas foram registradas.</b> Obrigado! Se quiser, ainda dá para alterar.</span>`;
  } else if (pending.length && done.length === qs.length) {
    st.className = 'rc-status wait';
    st.innerHTML = `${icon('refresh')}<span><b>Enviando suas respostas…</b> Se estiver sem internet, elas são enviadas assim que a conexão voltar.</span>`;
  } else {
    st.className = 'rc-status miss';
    st.innerHTML = `${icon('info')}<span>Você respondeu <b>${done.length} de ${qs.length}</b>. Toque em <b>Responder</b> para completar as que faltam.</span>`;
  }
  $('[data-recap]', slide).innerHTML = qs.map((q, k) => {
    const has = answered(q.id), v = state.local[q.id], who = state.local.personagem;
    const opt = q.type === 'single' && has ? q.options.find(o => o.id === v) : null;
    const img = opt?.img ? `<span class="rc-img">${[who !== 'ele' && [opt.img, opt.pos], who !== 'ela' && [opt.img2, opt.pos2]].filter(x => x && x[0])
      .map(([src, p]) => `<img src="${src}" alt="" style="--pos:${p || '50% 22%'}" ${lazy}>`).join('')}</span>` : '';
    return `<article class="rc${has ? '' : ' empty'}${img ? ' has-img' : ''}" style="--i:${k}">
      ${img}<p class="rc-k">${pad(k + 1)} · ${q.short}</p>
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
  $$('[data-step]', slide).forEach(el => el.classList.toggle('is-on', Number(el.dataset.step) <= s));
  [...slide.classList].filter(c => c.startsWith('step-')).forEach(c => slide.classList.remove(c));
  slide.classList.add('step-' + s);
  state.step = s;
  // no celular, leva a tela até o que acabou de aparecer
  if (state.fluid && !instant && s > prev) {
    const el = $(`[data-step="${s}"]`, slide);
    if (el) setTimeout(() => (el.classList.contains('end-curtain') ? slide.scrollTo({ top: 0 }) : revealInSlide(slide, el)), 60);
  }
  if (slide.classList.contains('s-who') && s === 0) slide._reset?.();
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
  }
  slide._reset?.();
  if (slide.dataset.q) paintSelection(slide);
  playVideos(slide);
}
function leave(slide) {
  if (slide.dataset.id === 'conteudo') ctStop();
  pauseVideos(slide);
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
  n = Math.max(0, Math.min(slides.length - 1, n));
  if (!isOn(slides[n])) n = nextOn(n, 1) >= 0 ? nextOn(n, 1) : nextOn(n, -1);
  pos.i = n;
  pos.step = Math.max(0, Math.min(maxStep(slides[pos.i]), step));
  render();
}
function next() {
  const slide = slides[pos.i];
  if (slide.dataset.id === 'perfil' && !state.me.name) {
    nameInput.classList.remove('shake'); void nameInput.offsetWidth; nameInput.classList.add('shake');
    if (!state.fluid) nameInput.focus();
    toast('Antes de começar, digite o seu nome.');
    return;
  }
  // a escolha da proposta é obrigatória: é ela que define qual votação de nome aparece
  if (slide.dataset.id === 'personagem' && !answered('personagem')) {
    const box = $('[data-opts]', slide);
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    toast('Escolha uma das propostas para continuar.');
    return;
  }
  if (pos.step < maxStep(slide)) { pos.step++; render(); return; }
  if (state.returnTo != null && slide.dataset.q) { const r = state.returnTo; state.returnTo = null; go(r); return; }
  const k = nextOn(pos.i + 1, 1);
  if (k >= 0) go(k);
}
function prev() {
  if (pos.step > 0) { pos.step--; render(); return; }
  const k = nextOn(pos.i - 1, -1);
  if (k >= 0) go(k, maxStep(slides[k]));
}

/* ---------- barra de progresso, sumário e moldura ---------- */
const progress = $('#progress');
progress.addEventListener('click', e => { const seg = e.target.closest('[data-go]'); if (seg && !state.fluid) go(Number(seg.dataset.go)); });

/** Refaz numeração, rodapés e barra de progresso com as lâminas que valem para esta pessoa. */
function layout() {
  const vis = visible();
  slides.forEach(s => { const pg = $('.sl-foot .pg', s); if (pg) pg.textContent = isOn(s) ? `${pad(vis.indexOf(s) + 1)} / ${pad(vis.length)}` : ''; });
  vis.filter(s => s.dataset.q).forEach((s, k) => $$('[data-qn]', s).forEach(el => { el.textContent = pad(k + 1); }));
  progress.innerHTML = vis.map((s, k) => {
    const chStart = k > 0 && s.dataset.chapter !== vis[k - 1].dataset.chapter;
    return `<span class="seg${chStart ? ' ch-start' : ''}${s.dataset.q ? ' is-q' : ''}" data-go="${slides.indexOf(s)}" title="${pad(k + 1)} · ${esc(s.dataset.title)}"></span>`;
  }).join('');
  $('#bb-n').textContent = pad(vis.length);
  if (state.i >= 0) updateChrome();
}

function buildToc() {
  let html = '', ch = null;
  visible().forEach((s, j) => {
    const k = slides.indexOf(s);
    if (s.dataset.chapter !== ch) { ch = s.dataset.chapter; html += `<p class="toc-ch">${CHAPTERS[ch]}</p>`; }
    const q = s.dataset.q;
    const tag = q ? (answered(q) ? `<span class="tag ok">${icon('check')}Respondida</span>` : '<span class="tag">Escolha</span>') : '';
    // antes da revelação, o sumário não entrega o nome
    const title = state.i < revealIndex && k >= revealIndex ? 'Continua…' : s.dataset.title;
    html += `<button class="toc-item${k === state.i ? ' cur' : ''}" data-go="${k}"><b>${pad(j + 1)}</b>${esc(title)}${tag}</button>`;
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
  const vis = visible(), at = vis.indexOf(s) + 1;
  $('#tb-count').textContent = `${pad(at)}/${pad(vis.length)}`;
  $('#bb-i').textContent = pad(at);
  $('#bb-title').textContent = s.dataset.title;
  $$('.seg', progress).forEach(seg => {
    const k = Number(seg.dataset.go);
    seg.classList.toggle('done', k < state.i);
    seg.classList.toggle('cur', k === state.i);
    if (slides[k].dataset.q) seg.classList.toggle('ans', answered(slides[k].dataset.q));
  });
  $$('[data-act="prev"]').forEach(b => { b.disabled = state.i === 0 && state.step === 0; });
  document.title = state.i >= revealIndex ? 'Personagem · UORT' : 'UORT · Personagem da marca';
  updateNav();
}

/* rótulo do botão principal + situação do salvamento */
function updateNav() {
  const s = slides[state.i];
  if (!s) return;
  const q = s.dataset.q ? byId(s.dataset.q) : null;
  const last = nextOn(state.i + 1, 1) < 0 && state.step >= maxStep(s);
  const btn = $('#btn-next'), label = $('#next-label'), info = $('#bb-save');
  let text = 'Próxima', ghost = false;
  if (s.dataset.id === 'perfil') { text = state.me.name ? 'Começar' : 'Continuar'; ghost = !state.me.name; }
  else if (q) {
    if (!answered(q.id)) { text = q.id === 'personagem' ? 'Continuar' : 'Pular'; ghost = true; }
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
    case 'End': e.preventDefault(); go(nextOn(slides.length - 1, -1)); break;
    case 'f': case 'F': if (!state.fluid) toggleFull(); break;
    case 's': case 'S': ACTIONS.toc(); break;
    case 'Escape': if (document.body.classList.contains('is-full') && !document.fullscreenElement) { document.body.classList.remove('is-full'); fit(); } break;
  }
});

// deslizar para os lados troca de lâmina (rolar para cima/baixo continua rolando a lâmina)
let swipe = null;
frame.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' || e.target.closest('input, a, [data-phone], .hot')) return;
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
layout();
const fromHash = parseInt(location.hash.slice(1), 10) - 1;
const resume = LS.get('maia-pos', 0);
if (Number.isFinite(fromHash) && fromHash >= 0) go(fromHash);
else if (resume > 0 && resume < slides.length) { go(resume); setTimeout(() => toast('Continuando de onde você parou.'), 600); }
else go(0);

// respostas que ficaram pendentes em outra visita
flushQueue().then(() => QUESTIONS.forEach(q => { if (answered(q.id) && state.sent[sentKey(q.id)] !== JSON.stringify(normalize(q, state.local[q.id]))) save(q.id); }));
