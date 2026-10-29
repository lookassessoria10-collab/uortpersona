/* ==========================================================================
   PERSONAGENS · UORT — página do resultado
   Cada tela ganha .is-in quando aparece (entrada das peças, números contando,
   barras e anéis enchendo). Setas, PageUp/PageDown e espaço pulam de tela em tela.
   ========================================================================== */
import { injectIcons } from './icons.js';

injectIcons();
window.rsReady = true;

const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sections = $$('.rs-s');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let current = 0;

/* ---------- números que contam até o valor final ---------- */
function countUp(scope) {
  $$('[data-count]', scope).forEach(el => {
    const end = Number(el.dataset.count);
    if (reduced) { el.textContent = end; return; }
    const delay = Number(el.dataset.delay || 0) * 1000, dur = 1400;
    el.textContent = '0';
    setTimeout(() => {
      const t0 = performance.now();
      const tick = now => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
  });
}

/* ---------- entrada de cada tela (uma vez) ---------- */
const reveal = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting || e.target.classList.contains('is-in')) return;
  e.target.classList.add('is-in');
  countUp(e.target);
}), { threshold: .3 });
sections.forEach(s => reveal.observe(s));

/* ---------- tela atual: pontos de navegação e cor da barra ---------- */
const dots = document.querySelector('.rs-dots');
dots.innerHTML = sections.map((s, k) => `<button data-go="${k}" aria-label="${s.dataset.label}" title="${s.dataset.label}"></button>`).join('');
const paint = () => {
  $$('button', dots).forEach((b, k) => b.classList.toggle('on', k === current));
  document.body.dataset.tone = sections[current].dataset.tone;
};
const watch = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { current = sections.indexOf(e.target); paint(); }
}), { rootMargin: '-50% 0px -50% 0px' });
sections.forEach(s => watch.observe(s));

const go = k => {
  const s = sections[Math.max(0, Math.min(sections.length - 1, k))];
  s.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
};
dots.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(Number(b.dataset.go)); });
document.querySelector('[data-next]')?.addEventListener('click', () => go(1));
addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (['ArrowDown', 'PageDown', ' ', 'ArrowRight'].includes(e.key)) { e.preventDefault(); go(current + 1); }
  else if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); go(current - 1); }
  else if (e.key === 'Home') { e.preventDefault(); go(0); }
  else if (e.key === 'End') { e.preventDefault(); go(sections.length - 1); }
});
paint();
