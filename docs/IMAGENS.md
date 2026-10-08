# Imagens e vídeo dos personagens

As imagens foram **recortadas das pranchas de referência** de cada personagem. Nenhum recorte contém texto ou
nome — só o personagem e detalhes de figurino. As pastas mantêm os nomes de trabalho (`maia/` e `otto/`),
mas só uma proposta vai seguir, e o nome depende da votação (Maia ou Íris; Otto ou Marco).

Como as pranchas originais têm 1672 × 941 px, os recortes foram ampliados 1,6–2× com suavização.
Ficam bons em notebook e TV comum; para projeção grande, **substitua pelos renders originais em alta**
mantendo o mesmo nome de arquivo (a apresentação não precisa de nenhuma outra mudança).

## Ela · `assets/maia/`

| Arquivo | Lâminas | Observação |
|---|---|---|
| `turn-back.webp` | 01 (silhueta) | Recorte de costas com fundo transparente |
| `det-cabelo.webp` | 01, 07 | Detalhe do cabelo (teaser e ponto de detalhe) |
| `det-blazer.webp`, `det-tecido.webp`, `det-tenis.webp` | 07 | Pontos de detalhe |
| `turn-front-w.webp`, `turn-side-w.webp`, `turn-back-w.webp` | 07 | Frente, perfil e costas sobre fundo branco puro |
| `hero-blazer.webp` | 09, 13 | Escolha da proposta e versão profissional |
| `retrato-sofa.webp` | 10 | Retrato sentada (voto do nome) |
| `h-solto`, `h-lateral`, `h-coque`, `h-treino`, `h-polido`, `h-casual` | 11 | Penteados |
| `sit-diaadia`, `sit-academia`, `digital-sentada` | 13, 14 | Versões e canais |
| `sit-esporte`, `post-ombro`, `p-comunicativa` | 16, 17 | Cenas dos posts de exemplo |
| `p-carismatica.webp` | 19 | Encerramento |
| `sit-trabalho`, `sit-rotina`, `g-conversa`, `g-orienta`, `g-acolhe`, `p-atenta`, `p-proxima`, `p-didatica`, `post-escada`, `post-celular`, `post-especialistas` | — | Reservadas para novos conteúdos (não usadas nas lâminas) |

## Ele · `assets/otto/`

Recortes das pranchas do personagem (Visual, Quem é, Traços de personalidade, Expressões e estilos,
Onde pode viver), ampliados 2× com interpolação cúbica e máscara de nitidez leve. As vistas de corpo inteiro
tiveram o fundo cinza-claro clareado para branco puro, igual às dela.

As maiores fotos dele estão nas pranchas "Quem é" (sentado, sorrindo) e "Onde pode viver" (sentado com o
celular): por isso `hero`, `retrato`, `digital-sentada` e `celular` são as usadas nos espaços grandes.
As demais vêm de quadros pequenos das pranchas e só aparecem em tamanhos menores.

| Arquivo | Lâminas | Observação |
|---|---|---|
| `turn-back.webp` | 01 (silhueta) | Recorte de costas com fundo transparente |
| `det-relogio.webp`, `det-tenis.webp` | 01, 08 | Detalhes para o teaser e os pontos de detalhe |
| `det-cabelo.webp`, `det-tecido.webp` | 08 | Pontos de detalhe (barba e cabelo, jaqueta) |
| `turn-front-w.webp`, `turn-side-w.webp`, `turn-back-w.webp` | 08 | Frente, perfil e costas sobre fundo branco puro |
| `hero.webp` | 09 | Escolha da proposta — sentado, sorrindo |
| `retrato.webp` | 16 | Retrato fechado (post "Conheça os especialistas") |
| `digital-sentada.webp` | 12, 13, 14 | Sentado com o celular (voto do nome, versão digital e canais) |
| `celular.webp` | 16, 17 | Retrato fechado com o celular (Pronto Atendimento) |
| `e-polido`, `e-casual`, `e-treino` | 13 | Versões profissional, dia a dia e movimento |
| `p-atento.webp` | 16, 17 | "Caiu no fim de semana. E agora?" |
| `p-carismatico.webp` | 19 | Encerramento |
| `e-sorriso`, `e-atento`, `e-descontraido`, `g-conversa`, `g-orienta`, `g-acolhe`, `p-comunicativo`, `p-proximo`, `p-didatico` | — | Reservadas para novos conteúdos (não usadas nas lâminas) |

## Vídeo da revelação · `assets/video/`

| Arquivo | Lâmina | Observação |
|---|---|---|
| `revelacao.mp4` | 06 | Os dois na recepção da UORT, acenando. 1280×720, 30 fps, 4 s, H.264, sem áudio (~330 KB) |
| `revelacao.webp` | 06 | Capa (primeiro quadro, ~65 KB): aparece enquanto o vídeo carrega e no modo estático |

O original (1920×1080, ~5,3 MB, com áudio) foi recodificado quadro a quadro para ficar leve sem perder qualidade
visível. O vídeo só é baixado quando a pessoa está a duas lâminas da revelação, toca sem som e em loop, e não
carrega com `?estatico`, com "reduzir movimento" ativado no aparelho ou no modo de economia de dados (fica a capa).

Para trocar o vídeo, mantenha os mesmos nomes de arquivo, de preferência em 16:9, curto (até ~6 s), sem áudio,
em 1280×720 e com até ~1,5 MB. A capa deve ser o primeiro quadro do vídeo, para a troca capa → vídeo não aparecer.

## Descrições-âncora (usar em toda geração para manter a mesma pessoa)

Anexe 2 ou 3 imagens de referência do personagem junto com o texto.

**Ela**

> Mulher negra brasileira, 32 anos, de Salvador, pele marrom média com subtom quente, rosto oval,
> maçãs do rosto marcadas, olhos castanho-escuros amendoados, sobrancelhas definidas, nariz de base larga,
> lábios cheios, sorriso aberto e acolhedor; corpo esguio e postura natural; cabelo crespo natural volumoso
> (cachos 4a/4b) castanho-escuro; argolas douradas médias. Figurino de referência: blazer azul-marinho com a
> barra das mangas dobrada mostrando forro teal, regata branca canelada, calça pantalona azul-marinho, tênis branco.
> Fotografia realista, editorial contemporâneo, luz natural suave, paleta azul-marinho, teal, ciano e branco.
> Mesmos traços faciais, mesma idade aparente, mesmo tom de pele e mesma estrutura corporal das imagens de referência.

Referências sugeridas: `hero-blazer.webp`, `h-solto.webp`, `turn-front-w.webp`.

**Ele**

> Homem brasileiro adulto, pele clara com tom levemente bronzeado, cabelo castanho cacheado e volumoso,
> barba cheia e bem aparada, sorriso aberto; corpo atlético e postura descontraída. Figurino de referência:
> jaqueta esportiva azul-marinho com zíper e detalhes em teal, camiseta teal, calça jogger azul-marinho,
> tênis branco e smartwatch preto. Fotografia realista, editorial contemporâneo, luz natural suave,
> paleta azul-marinho, teal, ciano e branco. Mesmos traços faciais, mesma idade aparente, mesmo tom de pele
> e mesma estrutura corporal das imagens de referência.

Referências sugeridas: `hero.webp`, `turn-front-w.webp`, `e-polido.webp`.

**Evitar (os dois):** aparência caricata, estética infantil, proporções de animação, jaleco ou estetoscópio
(eles não são médicos), elementos folclóricos ou regionais clichês.
