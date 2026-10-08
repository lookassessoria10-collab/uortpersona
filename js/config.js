/* ==========================================================================
   PERSONAGENS · UORT — fonte única do questionário
   Usado pela apresentação (index.html), pelo painel (resultados.html) e pela
   API (/api). Para mudar um texto ou uma alternativa, mude apenas aqui.
   ========================================================================== */

export const SETTINGS = {
  // Nome da rodada em que as respostas são agrupadas no painel.
  // Para separar rodadas (ex.: sócios e colaboradores), envie o link com ?sessao=nome
  defaultSession: 'principal',
  // A partir desta lâmina os personagens são revelados
  revealSlide: 'revelacao',
  // Mudou o questionário? Aumente o número: os aparelhos que já abriram a versão
  // anterior começam do zero (respostas e posição guardadas no navegador).
  version: 2,
};

const MAIA = 'assets/maia/';
const OTTO = 'assets/otto/';

export const QUESTIONS = [
  {
    id: 'dna', n: '01', type: 'multi', max: 3, slide: 'dna',
    short: 'DNA da personalidade',
    title: 'Escolha 3 características que não podem faltar nos personagens.',
    options: [
      { id: 'proximidade', label: 'Proximidade' },
      { id: 'inteligencia', label: 'Inteligência' },
      { id: 'bom-humor', label: 'Bom humor' },
      { id: 'atencao', label: 'Atenção' },
      { id: 'didatica', label: 'Didática' },
      { id: 'seguranca', label: 'Segurança' },
      { id: 'curiosidade', label: 'Curiosidade' },
      { id: 'acolhimento', label: 'Acolhimento' },
      { id: 'energia', label: 'Energia' },
      { id: 'elegancia', label: 'Elegância' },
      { id: 'leveza', label: 'Leveza' },
      { id: 'confianca', label: 'Confiança' },
    ],
  },
  {
    // rows: [marca, título, detalhe] — a marca é uma letra (acróstico) ou um ícone
    id: 'nome-ela', n: '02', type: 'single', slide: 'nome-ela',
    short: 'Nome dela',
    title: 'Qual nome combina mais com ela?',
    options: [
      { id: 'maia', label: 'Maia', idea: 'O conceito está no próprio nome.',
        rows: [
          ['M', 'Movimento', 'o que a UORT ajuda cada pessoa a recuperar e manter'],
          ['A', 'Acolhimento', 'o jeito de receber quem chega'],
          ['I', 'Informação', 'clara, confiável e fácil de entender'],
          ['A', 'Acesso', 'o caminho até o especialista certo'],
        ] },
      { id: 'iris', label: 'Íris', idea: 'Na mitologia grega, a mensageira que liga mundos.',
        rows: [
          ['I', 'Incentivo', 'um empurrão para se mexer e se cuidar'],
          ['R', 'Retorno', 'de volta às atividades, com segurança'],
          ['I', 'Informação', 'clara, confiável e fácil de entender'],
          ['S', 'Segurança', 'em cada orientação, do primeiro contato ao especialista'],
        ] },
    ],
  },
  {
    id: 'cabelo', n: '03', type: 'single', slide: 'cabelo',
    short: 'Cabelo e expressão',
    title: 'Qual delas parece mais com ela chegando para trabalhar hoje?',
    options: [
      { id: 'solto', label: 'Natural, volume total', desc: 'O cabelo natural, do jeito que ele é.', img: MAIA + 'h-solto.webp' },
      { id: 'lateral', label: 'Volume de lado', desc: 'Solto, com o volume jogado para um lado.', img: MAIA + 'h-lateral.webp' },
      { id: 'coque', label: 'Coque alto', desc: 'Prático para um dia de agenda cheia.', img: MAIA + 'h-coque.webp' },
      { id: 'treino', label: 'Preso para treinar', desc: 'Do trabalho direto para a academia.', img: MAIA + 'h-treino.webp' },
      { id: 'polido', label: 'Mais alinhado', desc: 'Para uma reunião importante.', img: MAIA + 'h-polido.webp' },
      { id: 'casual', label: 'Fim de semana', desc: 'Jaqueta jeans e leveza no rosto.', img: MAIA + 'h-casual.webp' },
    ],
  },
  {
    id: 'nome-ele', n: '04', type: 'single', slide: 'nome-ele',
    short: 'Nome dele',
    title: 'Qual nome combina mais com ele?',
    options: [
      { id: 'otto', label: 'Otto', idea: 'Um nome que vai e volta, como o movimento.',
        rows: [
          ['refresh', 'Ida e volta', 'Otto se lê igual de trás para frente'],
          ['star', 'Curto e marcante', 'quatro letras, fácil de falar e de lembrar'],
          ['sparkle', 'Atual e próximo', 'soa moderno sem perder a simpatia'],
        ] },
      { id: 'marcos', label: 'Marcos', idea: 'Na recuperação, cada passo é um marco.',
        rows: [
          ['route', 'Cada avanço conta', 'soa como “marco”, o ponto que sinaliza o caminho'],
          ['shield', 'Clássico e confiável', 'um nome conhecido, que transmite segurança'],
          ['users', 'Gente como a gente', 'parece alguém da família, do trabalho, do bairro'],
        ] },
    ],
  },
  {
    // img/img2: os dois personagens na mesma versão (ela em cima, ele embaixo)
    id: 'versao', n: '05', type: 'single', slide: 'versoes',
    short: 'Versão mais frequente',
    title: 'Em qual versão você imagina os personagens aparecendo com mais frequência?',
    options: [
      { id: 'profissional', label: 'Profissional', desc: 'Blazer e jaqueta, presença confiante.',
        img: MAIA + 'hero-blazer.webp', pos: '50% 12%', img2: OTTO + 'e-polido.webp', pos2: '50% 12%' },
      { id: 'dia-a-dia', label: 'Dia a dia', desc: 'Look casual, rotina da cidade.',
        img: MAIA + 'sit-diaadia.webp', pos: '50% 14%', img2: OTTO + 'e-casual.webp', pos2: '50% 22%' },
      { id: 'movimento', label: 'Movimento', desc: 'Roupa esportiva, pronta para treinar.',
        img: MAIA + 'sit-academia.webp', pos: '50% 14%', img2: OTTO + 'e-treino.webp', pos2: '50% 10%' },
      { id: 'digital', label: 'Digital', desc: 'Celular, comunicação e conteúdos.',
        img: MAIA + 'digital-sentada.webp', pos: '60% 14%', img2: OTTO + 'digital-sentada.webp', pos2: '40% 8%' },
    ],
  },
  {
    id: 'canais', n: '06', type: 'multi', max: 2, slide: 'canais',
    short: 'Onde aparecer primeiro',
    title: 'Onde você gostaria de encontrar os personagens primeiro?',
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
    id: 'conversa', n: '07', type: 'multi', max: 2, slide: 'conversa',
    short: 'Tipo de conversa',
    title: 'Que tipo de conversa os personagens deveriam puxar mais?',
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
    id: 'primeiro', n: '08', type: 'single', slide: 'primeiro',
    short: 'Primeiro conteúdo',
    title: 'Qual deveria ser o primeiro conteúdo dos personagens?',
    options: [
      { id: 'caiu', label: 'Caiu no fim de semana. E agora?', img: OTTO + 'p-atento.webp', pos: '50% 25%' },
      { id: 'joelho', label: 'Seu joelho reclama ao subir escadas?', img: MAIA + 'sit-esporte.webp', pos: '50% 18%' },
      { id: 'pa', label: 'Você sabe quando procurar o Pronto Atendimento?', img: OTTO + 'celular.webp', pos: '50% 22%' },
      { id: 'ombro', label: 'Dor no ombro depois da academia é normal?', img: MAIA + 'post-ombro.webp', pos: '50% 30%' },
    ],
  },
];

export const byId = id => QUESTIONS.find(q => q.id === id);

/** Valida e normaliza uma resposta. Retorna undefined se for inválida. */
export function normalize(q, value) {
  if (!q) return undefined;
  const ids = q.options.map(o => o.id);
  if (q.type === 'single') return ids.includes(value) ? value : undefined;
  if (!Array.isArray(value)) return undefined;
  const uniq = [...new Set(value)].filter(v => ids.includes(v));
  return uniq.length >= 1 && uniq.length <= q.max && uniq.length === value.length ? uniq : undefined;
}

/** Agrega respostas [{v}] de uma pergunta. */
export function aggregate(q, answers) {
  const out = { n: answers.length, counts: {} };
  q.options.forEach(o => { out.counts[o.id] = 0; });
  answers.forEach(a => (Array.isArray(a.v) ? a.v : [a.v]).forEach(id => { if (id in out.counts) out.counts[id]++; }));
  return out;
}

/** Texto legível de uma resposta. */
export function answerLabel(q, v) {
  if (v == null) return '';
  const name = id => (q.options.find(o => o.id === id) || {}).label || id;
  return Array.isArray(v) ? v.map(name).join(', ') : name(v);
}
