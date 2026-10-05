# Imagens da Maia

Todas as imagens em `assets/maia/` foram **recortadas das pranchas de referência da personagem** (as que ainda
usavam o nome antigo). Nenhum recorte contém texto ou nome — só a personagem e detalhes de figurino.

Como as pranchas originais têm 1672 × 941 px, os recortes foram ampliados 1,6–2× com suavização.
Ficam bons em notebook e TV comum; para projeção grande, **substitua pelos renders originais em alta**
mantendo o mesmo nome de arquivo (a apresentação não precisa de nenhuma outra mudança).

## Onde cada imagem aparece

| Arquivo | Lâminas | Observação |
|---|---|---|
| `turn-back.webp` | 01 (silhueta) | Recorte de costas com fundo transparente |
| `det-cabelo.webp`, `det-tecido.webp`, `det-tenis.webp`, `det-blazer.webp` | 01, 05, 10 | Detalhes para o teaser, o avatar das mensagens e os pontos clicáveis |
| `turn-front-w.webp`, `turn-side-w.webp`, `turn-back-w.webp` | 10 | Frente, perfil e costas sobre fundo branco puro |
| `hero-blazer.webp` | 09, 11 | Revelação — recortada acima do quadril |
| `digital-sentada.webp` | 11, 14 | Sentada com celular |
| `sit-academia`, `sit-rotina`, `sit-trabalho`, `sit-esporte`, `sit-diaadia` | 11, 13 | Situações do dia a dia |
| `h-solto`, `h-lateral`, `h-coque`, `h-treino`, `h-polido`, `h-casual` | 12 | Penteados |
| `retrato-sofa.webp` | 13, 19 | Retrato sentada |
| `g-conversa`, `g-orienta`, `p-atenta`, `p-proxima` | 13, 16, 17 | Gestos e expressões |
| `g-acolhe`, `p-comunicativa`, `p-didatica`, `p-carismatica`, `post-especialistas` | — | Reservadas para novos conteúdos (não usadas nas lâminas) |
| `post-escada`, `post-ombro`, `post-celular` | 13, 16, 17 | Cenas dos posts de exemplo |

## Cenas que ainda faltam

A lâmina 13 tem dois espaços marcados **INSERIR IMAGEM** (o material de referência não tinha essas cenas em
resolução utilizável):

1. **Maia chegando à UORT** — salvar como `assets/maia/sit-chegando.webp`
2. **Maia conversando com um especialista** — salvar como `assets/maia/sit-especialista.webp`

Para trocar o espaço pela foto, em `index.html` (lâmina 13) substitua o bloco `<div class="ph-box">…</div>`
por `<img src="assets/maia/sit-chegando.webp" alt="Maia chegando à UORT">` e remova a classe `ph` da `<figure>`.

### Descrição-âncora (usar em toda geração para manter a mesma mulher)

> Maia: mulher negra brasileira, 32 anos, de Salvador, pele marrom média com subtom quente, rosto oval,
> maçãs do rosto marcadas, olhos castanho-escuros amendoados, sobrancelhas definidas, nariz de base larga,
> lábios cheios, sorriso aberto e acolhedor; corpo esguio e postura natural; cabelo crespo natural volumoso
> (cachos 4a/4b) castanho-escuro; argolas douradas médias. Figurino de referência: blazer azul-marinho com a
> barra das mangas dobrada mostrando forro teal, regata branca canelada, calça pantalona azul-marinho, tênis branco.
> Fotografia realista, editorial contemporâneo, luz natural suave, paleta azul-marinho, teal, ciano e branco.
> Mesmos traços faciais, mesma idade aparente, mesmo tom de pele e mesma estrutura corporal das imagens de referência.

Anexe 2 ou 3 imagens de referência (ex.: `hero-blazer.webp`, `h-solto.webp`, `turn-front-w.webp`) junto com o texto.

**Evitar:** aparência caricata, estética infantil, corpo exageradamente curvilíneo, proporções de animação,
jaleco ou estetoscópio na Maia (ela não é médica), elementos folclóricos ou regionais clichês.

### Prompt · chegando à UORT
> [descrição-âncora] Maia entrando pela porta de vidro de uma clínica de ortopedia moderna e clara, recepção
> com madeira clara e detalhes em teal, segurando o celular com uma mão e a alça da bolsa com a outra, sorrindo
> para alguém fora do quadro, cabelo solto. Plano americano, 4:5, profundidade de campo rasa, sem logotipos legíveis.

### Prompt · conversando com um especialista
> [descrição-âncora] Maia sentada em uma sala de consultório moderna, ouvindo com atenção um ortopedista de
> jaleco branco (de costas ou de perfil, rosto pouco visível), que aponta para um modelo anatômico de joelho
> sobre a mesa. Maia está de blazer azul-marinho, cabelo preso em coque alto, expressão curiosa e atenta.
> 4:5, luz natural de janela, sem textos.
