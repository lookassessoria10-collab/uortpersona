# UORT · Escolha do novo personagem da marca

Experiência interativa da **LOOK Assessoria de Comunicação** para a **UORT — Ortopedia e Traumatologia**.
Cada sócio ou colaborador recebe **um link**, percorre a apresentação no celular ou no computador e responde
ali mesmo: **escolhe uma das duas propostas de personagem** (ela ou ele) e **vota o nome** dessa proposta,
além de algumas escolhas rápidas (7 ou 8, conforme a proposta). As respostas são salvas automaticamente;
**só a equipe vê o resultado**, no painel protegido por senha.

Só uma das propostas vai seguir:

| Proposta | Nomes em votação |
|---|---|
| Ela — mulher negra, brasileira, de Salvador, 30–35 anos | **Maia** ou **Íris** |
| Ele — presença masculina, esportiva e acessível | **Otto** ou **Marco** |

| Endereço | Para quem | O que faz |
|---|---|---|
| `/` | Quem recebe o link | Apresentação + questionário (celular e computador) |
| `/resultados` | Equipe LOOK / UORT (com senha) | Placar da proposta e dos nomes, gráficos por pergunta, tabela e exportação CSV |

Site estático (HTML, CSS e JavaScript puros, sem build) + três funções serverless na Vercel para gravar as respostas.

---

## Roteiro

| # | Lâmina | O que acontece |
|---|---|---|
| 01 | Tem alguém novo chegando à UORT | Teaser com as duas silhuetas de costas. Toque revela "não vai atender consultas…" |
| 02 | Por que criar um novo personagem? | Toque revela os limites: não é profissional de saúde, não diagnostica, não substitui |
| 03 | Antes de começar | A pessoa digita o nome (obrigatório para continuar) |
| 04 | **Escolha** · DNA | 3 de 12 características, com a hélice acendendo |
| 05 | Antes de mostrar as propostas… | Mostra as 3 características escolhidas e prepara a revelação |
| 06 | Revelação: **Ela ou ele?** | Transição especial. Vídeo curto com as duas propostas juntas; só uma vai seguir |
| 07 | Quem é ela? (proposta A) | Frente, perfil e costas, pontos de detalhe. Toque revela a regra de consistência |
| 08 | Quem é ele? (proposta B) | Frente, perfil e costas, pontos de detalhe. Toque revela a regra de consistência |
| 09 | **Escolha** · Quem deve representar a UORT? | Ela ou ele. **Obrigatória**: sem ela não dá para seguir |
| 10 | **Escolha** · Nome dela | Só para quem escolheu ela: **Maia** (acróstico M·A·I·A) ou **Íris** (acróstico Í·R·I·S) |
| 11 | **Escolha** · Cabelo e expressão | Só para quem escolheu ela: seis penteados |
| 12 | **Escolha** · Nome dele | Só para quem escolheu ele: **Otto** ou **Marco** |
| 13 | **Escolha** · Versões | Profissional · Dia a dia · Movimento · Digital, com a proposta escolhida |
| 14 | **Escolha** · Onde aparecer primeiro | Até 2 de 10 canais |
| 15 | **Escolha** · Tipo de conversa | Até 2 de 6 temas |
| 16 | Como isso vira conteúdo? | Mockup de post em carrossel: personagem pergunta → especialista explica → próximo passo |
| 17 | **Escolha** · Primeiro conteúdo | A mais escolhida por todos vira candidata real à estreia |
| 18 | Suas escolhas | Resumo das respostas da pessoa, com "Alterar" / "Responder" |
| 19 | Encerramento | Toque fecha com "Em breve · Informação · Acolhimento · Movimento" |

Cada pessoa vê **18 lâminas** (se escolher ela) ou **17** (se escolher ele): as lâminas que não valem para a
proposta escolhida são puladas, e a numeração e a barra de progresso se ajustam sozinhas. Se a pessoa mudar
de ideia depois, as respostas que só valiam para a outra proposta são apagadas.

**Os conceitos dos nomes** (editáveis em `js/config.js`):
- **Maia** — Movimento · Acolhimento · Informação · Acesso.
- **Íris** — na mitologia grega, a mensageira que liga mundos. Incentivo · Retorno · Informação · Segurança.
- **Otto** — lembra Ortopedia ("orto") e se lê igual de trás para frente: ida e volta, como o movimento.
- **Marco** — o ponto que sinaliza o caminho: na recuperação, cada passo é um marco.

**Como funciona para quem responde**
- No celular, cada lâmina vira uma tela vertical que rola. Botões grandes embaixo; também dá para deslizar para os lados.
- O botão principal mostra **Pular** enquanto a pergunta não foi respondida e **Próxima** depois (a escolha da proposta não pode ser pulada). A barra de baixo indica **✓ Resposta salva**.
- Não existe botão de enviar: cada escolha é gravada na hora. Sem internet, a resposta fica guardada no aparelho e é reenviada depois.
- Ao voltar ao link, continua de onde parou. No resumo dá para alterar qualquer resposta.
- Ninguém vê o resultado dos outros.

No computador, a apresentação mantém o formato 16:9 (setas do teclado, `F` tela cheia, `S` sumário).
`?estatico` no fim do endereço desliga as animações.

---

## Publicar (GitHub + Vercel)

1. **GitHub:** crie um repositório e envie esta pasta.
2. **Vercel:** em [vercel.com/new](https://vercel.com/new), importe o repositório.
   **Framework Preset:** `Other` · **Build Command:** vazio · **Output Directory:** vazio (raiz).
3. **Banco de dados:** no projeto da Vercel, aba **Storage** → **Upstash for Redis** (plano gratuito) → **Connect**.
   As variáveis de acesso são criadas sozinhas.
4. **Senha da equipe:** em **Settings → Environment Variables**, crie `PRESENTER_KEY` (ex.: uma frase longa).
   Ela protege o painel `/resultados`.
5. **Redeploy** (Deployments → ⋯ → Redeploy).
6. Confira `https://SEU-ENDERECO.vercel.app/api/status`: deve mostrar `"storage":"redis"` e `"keyConfigured":true`.

### Antes de enviar o link

1. Abra o link no seu celular e responda tudo (teste real).
2. Confira em `/resultados` se as respostas apareceram.
3. Apague o teste: em `/resultados`, escolha a rodada e use **Apagar rodada**.
4. No seu aparelho de teste, limpe os dados do site (ou use uma aba anônima) para começar do zero.

Mudou as perguntas depois que alguém já abriu o link? Aumente `version` em `js/config.js`: os aparelhos que
abriram a versão anterior começam do zero.

### Rodadas (opcional)

Todas as respostas entram na rodada `principal`. Para separar grupos, envie links diferentes:
`https://SEU-ENDERECO.vercel.app/?sessao=socios` e `…/?sessao=colaboradores`.
No painel, cada rodada aparece separada (ou somadas em "Todas as rodadas").

---

## Medir (`/resultados`)

- **Indicadores:** participantes, quem respondeu tudo, quem parou no meio, a **proposta mais escolhida**
  e o **placar dos nomes** (nome mais votado para ela, entre quem a escolheu, e para ele, entre quem o escolheu).
- **Gráfico por pergunta:** escolhas, percentual sobre quem respondeu e a mais escolhida.
- **Filtro:** rodada.
- **Tabela** com cada resposta individual (data, rodada, nome, pergunta, resposta) e busca.
- **Exportar:** `Respostas (CSV)` (uma linha por resposta) e `Resumo (CSV)` (contagem por opção). Abrem direto no Excel.

Cada aparelho conta como uma pessoa; se ela mudar de ideia, a resposta nova substitui a anterior.

---

## Rodar no computador

Dois cliques em `ABRIR-APRESENTACAO.bat` (Windows, precisa do [Node.js](https://nodejs.org)) ou:

```bash
npm run dev
```

Abre em `http://localhost:5173`. Localmente as respostas ficam na memória enquanto o servidor estiver aberto,
e a senha do painel é `uort`. Para testar no celular na mesma rede Wi-Fi, use o IP do computador
(ex.: `http://192.168.0.10:5173`).

---

## Onde editar

| O quê | Arquivo |
|---|---|
| Perguntas, alternativas, nomes em votação e seus conceitos; `when` faz uma pergunta valer só para uma proposta | `js/config.js` (vale para a apresentação, o painel e a API) |
| Textos das lâminas | `index.html` |
| Visual — computador (1920×1080) e celular (seção "MODO CELULAR") | `css/deck.css` |
| Temas do mockup de conteúdo (lâmina 16) | `js/deck.js` → `THEMES` |
| Pontos de detalhe (lâminas 07 e 08) | `js/deck.js` → `HOTS` |
| Imagens dos personagens | `assets/maia/` (ela) e `assets/otto/` (ele) — veja `docs/IMAGENS.md` |
| Vídeo da revelação (lâmina 06) | `assets/video/` — veja `docs/IMAGENS.md` |

## Estrutura

```
index.html           apresentação + questionário (19 lâminas; cada pessoa vê 17 ou 18)
resultados.html      painel da equipe
css/                 base.css · deck.css · resultados.css
js/config.js         perguntas (fonte única)
js/deck.js           apresentação, questionário e salvamento automático
js/resultados.js     painel e exportação
js/client.js         chamadas à API, identificação do aparelho, fila offline
api/                 vote · results · status (funções da Vercel)
lib/                 armazenamento (Upstash Redis / memória) e utilitários HTTP
assets/maia/         imagens dela
assets/otto/         imagens dele
assets/video/        vídeo da revelação e sua capa
dev-server.mjs       servidor local
```

## Privacidade

São gravados apenas: nome, as respostas e um identificador aleatório do aparelho.
O painel e a exportação exigem a senha da equipe. As páginas não são indexadas por buscadores (`noindex`).
