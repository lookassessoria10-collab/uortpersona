/* ==========================================================================
   MAIA · UORT — fonte única do questionário
   Usado pela apresentação (index.html), pelo painel (resultados.html) e pela
   API (/api). Para mudar um texto ou uma alternativa, mude apenas aqui.
   ========================================================================== */

export const SETTINGS = {
  // Nome da rodada em que as respostas são agrupadas no painel.
  // Para separar rodadas (ex.: sócios e colaboradores), envie o link com ?sessao=nome
  defaultSession: 'principal',
  // A partir desta lâmina o nome MAIA é revelado
  revealSlide: 'revelacao',
};

export const ROLES = [
  { id: 'socio', label: 'Sócio(a)' },
  { id: 'colaborador', label: 'Colaborador(a)' },
  { id: 'outro', label: 'Outro vínculo' },
];

const IMG = 'assets/maia/';

export const QUESTIONS = [
  {
    id: 'papel', n: '01', type: 'single', slide: 'papel',
    short: 'Papel principal',
    title: 'Se essa nova integrante estivesse aqui hoje, qual deveria ser o principal papel dela?',
    options: [
      { id: 'anfitria', label: 'A anfitriã', desc: 'Apresenta a UORT e facilita o acesso às informações.', icon: 'door' },
      { id: 'guia', label: 'A guia', desc: 'Ajuda a pessoa a entender onde procurar atendimento e qual pode ser o próximo passo.', icon: 'compass' },
      { id: 'comunicadora', label: 'A comunicadora', desc: 'Traduz assuntos de saúde para situações mais próximas da rotina.', icon: 'mic' },
    ],
  },
  {
    id: 'tom', n: '02', type: 'single', slide: 'tom',
    short: 'Jeito de falar',
    title: 'Qual dessas mensagens soa mais como a UORT?',
    options: [
      { id: 'direta', label: 'Mais direta', desc: 'Vai ao ponto e entrega a informação rapidamente.',
        sample: 'Dor no joelho ao subir escadas? Pode ser sinal de sobrecarga. Um especialista da UORT pode avaliar.' },
      { id: 'conversada', label: 'Mais conversada', desc: 'Explica, contextualiza e cria proximidade.',
        sample: 'Sabe aquela dor no joelho que aparece justo na hora de subir escadas? Ela pode ter várias causas, e entender o que está por trás é o primeiro passo. Os especialistas da UORT podem ajudar.' },
      { id: 'descontraida', label: 'Mais descontraída', desc: 'Usa situações cotidianas e humor discreto.',
        sample: 'Se a escada do prédio virou sua maior adversária do dia, talvez seja o joelho pedindo atenção. Que tal ouvir o que um especialista da UORT tem a dizer?' },
    ],
  },
  {
    id: 'estilo', n: '03', type: 'pairs', slide: 'estilo',
    short: 'Esta ou aquela',
    title: 'Rapidinho: esta ou aquela?',
    pairs: [
      { id: 'humor', short: 'Humor', a: { label: 'Bom humor leve, quando cabe' }, b: { label: 'Sempre mais séria' } },
      { id: 'explica', short: 'Explicação', a: { label: 'Explica com exemplos do dia a dia' }, b: { label: 'Vai direto à informação' } },
      { id: 'emoji', short: 'Emoji', a: { label: 'Usa emoji de vez em quando' }, b: { label: 'Não usa emoji' } },
      { id: 'conversa', short: 'Conversa', a: { label: 'Puxa conversa e faz perguntas' }, b: { label: 'Responde com objetividade' } },
    ],
  },
  {
    id: 'dna', n: '04', type: 'multi', max: 3, slide: 'dna',
    short: 'DNA da personalidade',
    title: 'Escolha 3 características que não podem faltar.',
    options: [
      { id: 'proxima', label: 'Próxima' },
      { id: 'inteligente', label: 'Inteligente' },
      { id: 'bem-humorada', label: 'Bem-humorada' },
      { id: 'atenta', label: 'Atenta' },
      { id: 'didatica', label: 'Didática' },
      { id: 'segura', label: 'Segura' },
      { id: 'curiosa', label: 'Curiosa' },
      { id: 'acolhedora', label: 'Acolhedora' },
      { id: 'ativa', label: 'Ativa' },
      { id: 'elegante', label: 'Elegante' },
      { id: 'espontanea', label: 'Espontânea' },
      { id: 'confiavel', label: 'Confiável' },
    ],
  },
  {
    id: 'versao', n: '05', type: 'single', slide: 'versoes',
    short: 'Versão mais frequente',
    title: 'Qual versão da Maia você imagina aparecendo com mais frequência?',
    options: [
      { id: 'profissional', label: 'Maia profissional', desc: 'Blazer, cabelo natural.', img: IMG + 'hero-blazer.webp', pos: '50% 18%' },
      { id: 'dia-a-dia', label: 'Maia dia a dia', desc: 'Look casual, rotina da cidade.', img: IMG + 'sit-diaadia.webp', pos: '50% 20%' },
      { id: 'movimento', label: 'Maia movimento', desc: 'Roupa esportiva, cabelo preso.', img: IMG + 'sit-academia.webp', pos: '50% 20%' },
      { id: 'digital', label: 'Maia digital', desc: 'Celular, comunicação e conteúdos.', img: IMG + 'digital-sentada.webp', pos: '50% 22%' },
    ],
  },
  {
    id: 'cabelo', n: '06', type: 'single', slide: 'cabelo',
    short: 'Cabelo e expressão',
    title: 'Qual delas parece mais com a Maia chegando para trabalhar hoje?',
    options: [
      { id: 'solto', label: 'Natural, volume total', desc: 'O cabelo natural, do jeito que ele é.', img: IMG + 'h-solto.webp' },
      { id: 'lateral', label: 'Volume de lado', desc: 'Solto, com o volume jogado para um lado.', img: IMG + 'h-lateral.webp' },
      { id: 'coque', label: 'Coque alto', desc: 'Prático para um dia de agenda cheia.', img: IMG + 'h-coque.webp' },
      { id: 'treino', label: 'Preso para treinar', desc: 'Do trabalho direto para a academia.', img: IMG + 'h-treino.webp' },
      { id: 'polido', label: 'Mais alinhado', desc: 'Para uma reunião importante.', img: IMG + 'h-polido.webp' },
      { id: 'casual', label: 'Fim de semana', desc: 'Jaqueta jeans e leveza no rosto.', img: IMG + 'h-casual.webp' },
    ],
  },
  {
    id: 'canais', n: '07', type: 'multi', max: 2, slide: 'canais',
    short: 'Onde aparecer primeiro',
    title: 'Onde você gostaria de encontrar a Maia primeiro?',
    options: [
      { id: 'feed', label: 'Feed', icon: 'image' },
      { id: 'stories', label: 'Stories', icon: 'stories' },
      { id: 'whatsapp', label: 'WhatsApp', icon: 'whats' },
      { id: 'site', label: 'Site', icon: 'globe' },
      { id: 'landing', label: 'Landing pages', icon: 'layout' },
      { id: 'comunidade', label: 'Comunidade UORT', icon: 'users' },
      { id: 'pa', label: 'Pronto Atendimento', icon: 'cross' },
      { id: 'campanhas', label: 'Campanhas', icon: 'megaphone' },
      { id: 'videos', label: 'Vídeos', icon: 'video' },
      { id: 'educativos', label: 'Conteúdos educativos', icon: 'book' },
    ],
  },
  {
    id: 'conversa', n: '08', type: 'multi', max: 2, slide: 'conversa',
    short: 'Tipo de conversa',
    title: 'Que tipo de conversa a Maia deveria puxar mais?',
    options: [
      { id: 'quando', label: 'Quando procurar atendimento', desc: 'Sinais de que vale ir ao Pronto Atendimento ou a um especialista.', icon: 'cross' },
      { id: 'mitos', label: 'Mitos e verdades', desc: 'Gelo ou calor? Estalar o joelho faz mal?', icon: 'question' },
      { id: 'prevencao', label: 'Prevenção no dia a dia', desc: 'Postura, treino, calçado e pequenos hábitos.', icon: 'pulse' },
      { id: 'especialistas', label: 'Conhecendo os especialistas', desc: 'Quem cuida de cada parte do corpo na UORT.', icon: 'steth' },
      { id: 'bastidores', label: 'Bastidores da UORT', desc: 'Estrutura, equipe e como funciona o atendimento.', icon: 'home' },
      { id: 'duvidas', label: 'Dúvidas do público', desc: 'Perguntas reais respondidas por especialistas.', icon: 'dots' },
    ],
  },
  {
    id: 'primeiro', n: '09', type: 'single', slide: 'primeiro',
    short: 'Primeiro conteúdo',
    title: 'Qual deveria ser o primeiro conteúdo da Maia?',
    options: [
      { id: 'caiu', label: 'Caiu no fim de semana. E agora?', img: IMG + 'g-orienta.webp', pos: '50% 25%' },
      { id: 'joelho', label: 'Seu joelho reclama ao subir escadas?', img: IMG + 'post-escada.webp', pos: '50% 14%' },
      { id: 'pa', label: 'Você sabe quando procurar o Pronto Atendimento?', img: IMG + 'post-celular.webp', pos: '50% 20%' },
      { id: 'ombro', label: 'Dor no ombro depois da academia é normal?', img: IMG + 'post-ombro.webp', pos: '50% 30%' },
    ],
  },
];

export const byId = id => QUESTIONS.find(q => q.id === id);

/** Valida e normaliza uma resposta. Retorna undefined se for inválida. */
export function normalize(q, value) {
  if (!q) return undefined;
  if (q.type === 'pairs') {
    if (!Array.isArray(value) || value.length !== q.pairs.length) return undefined;
    return value.every(s => s === 'a' || s === 'b') ? value.slice() : undefined;
  }
  const ids = q.options.map(o => o.id);
  if (q.type === 'single') return ids.includes(value) ? value : undefined;
  if (!Array.isArray(value)) return undefined;
  const uniq = [...new Set(value)].filter(v => ids.includes(v));
  return uniq.length >= 1 && uniq.length <= q.max && uniq.length === value.length ? uniq : undefined;
}

/** Agrega respostas [{v}] de uma pergunta. */
export function aggregate(q, answers) {
  const out = { n: answers.length, counts: {} };
  if (q.type === 'pairs') {
    out.pairs = q.pairs.map(() => ({ a: 0, b: 0 }));
    answers.forEach(a => (a.v || []).forEach((s, i) => { if (out.pairs[i] && (s === 'a' || s === 'b')) out.pairs[i][s]++; }));
    return out;
  }
  q.options.forEach(o => { out.counts[o.id] = 0; });
  answers.forEach(a => (Array.isArray(a.v) ? a.v : [a.v]).forEach(id => { if (id in out.counts) out.counts[id]++; }));
  return out;
}

/** Texto legível de uma resposta. */
export function answerLabel(q, v) {
  if (v == null) return '';
  if (q.type === 'pairs') return (Array.isArray(v) ? v : []).map((s, i) => q.pairs[i]?.[s]?.label).filter(Boolean).join(' · ');
  const name = id => (q.options.find(o => o.id === id) || {}).label || id;
  return Array.isArray(v) ? v.map(name).join(', ') : name(v);
}
