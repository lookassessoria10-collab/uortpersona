# UORT · Vamos construir o DNA dos novos personagens

Experiência interativa da **LOOK Assessoria de Comunicação** para a **UORT — Ortopedia e Traumatologia**.
Cada sócio ou colaborador recebe **um link**, percorre a apresentação no celular ou no computador e responde
**8 escolhas rápidas** ali mesmo, incluindo **o nome de cada personagem**. As respostas são salvas
automaticamente; **só a equipe vê o resultado**, no painel protegido por senha.

São dois personagens da marca:

| Personagem | Nomes em votação |
|---|---|
| Ela — mulher negra, brasileira, de Salvador, 30–35 anos | **Maia** ou **Íris** |
| Ele — presença masculina, esportiva e acessível | **Otto** ou **Marcos** |

| Endereço | Para quem | O que faz |
|---|---|---|
| `/` | Quem recebe o link | Apresentação + questionário (celular e computador) |
| `/resultados` | Equipe LOOK / UORT (com senha) | Placar dos nomes, gráficos por pergunta, tabela e exportação CSV |

Site estático (HTML, CSS e JavaScript puros, sem build) + três funções serverless na Vercel para gravar as respostas.

---

## Roteiro

| # | Lâmina | O que acontece |
|---|---|---|
| 01 | Tem gente nova chegando à UORT | Teaser com as duas silhuetas de costas. Toque revela "eles não atendem consultas…" |
| 02 | Por que criar esses personagens? | Toque revela os limites: não são médicos, não diagnosticam, não substituem |
| 03 | Antes de começar | A pessoa digita o nome (obrigatório para continuar) |
| 04 | **Escolha 01** · DNA | 3 de 12 características, com a hélice acendendo |
| 05 | Antes de mostrar quem são… | Mostra as 3 características escolhidas e prepara a revelação |
| 06 | Revelação: **Ela & ele** | Transição especial. Os dois aparecem juntos; os nomes ficam para a votação |
| 07 | Quem é ela? | Frente, perfil e costas, pontos de detalhe. Toque revela a regra de consistência |
| 08 | **Escolha 02** · Nome dela | **Maia** (acróstico M·A·I·A) ou **Íris** (acróstico Í·R·I·S) |
| 09 | **Escolha 03** · Cabelo e expressão | Seis penteados |
| 10 | Quem é ele? | Frente, perfil e costas, pontos de detalhe. Toque revela a regra de consistência |
| 11 | **Escolha 04** · Nome dele | **Otto** ou **Marcos** |
| 12 | **Escolha 05** · Versões | Profissional · Dia a dia · Movimento · Digital (os dois lado a lado) |
| 13 | **Escolha 06** · Onde aparecer primeiro | Até 2 de 10 canais |
| 14 | **Escolha 07** · Tipo de conversa | Até 2 de 6 temas |
| 15 | Como isso vira conteúdo? | Mockup de post em carrossel: personagem pergunta → especialista explica → próximo passo |
| 16 | **Escolha 08** · Primeiro conteúdo | A mais escolhida por todos vira candidata real à estreia |
| 17 | Suas escolhas | Resumo das respostas da pessoa, com "Alterar" / "Responder" |
| 18 | Encerramento | Toque fecha com "Em breve · Informação · Acolhimento · Movimento" |

**Os conceitos dos nomes** (editáveis em `js/config.js`):
- **Maia** — Movimento · Acolhimento · Informação · Acesso.
- **Íris** — na mitologia grega, a mensageira que liga mundos. Incentivo · Retorno · Informação · Segurança.
- **Otto** — lê-se igual de trás para frente: ida e volta, como o movimento.
- **Marcos** — soa como "marco": na recuperação, cada passo é um marco.

**Como funciona para quem responde**
- No celular, cada lâmina vira uma tela vertical que rola. Botões grandes embaixo; também dá para deslizar para os lados.
- O botão principal mostra **Pular** enquanto a pergunta não foi respondida e **Próxima** depois. A barra de baixo indica **✓ Resposta salva**.
- Não existe botão de enviar: cada escolha é gravada na hora. Sem internet, a resposta fica guardada no aparelho e é reenviada depois.
- Ao voltar ao link, continua de onde parou. Na lâmina 17 dá para alterar qualquer resposta.
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

- **Indicadores:** participantes, quem respondeu tudo, quem parou no meio e o **placar dos nomes**
  (nome mais votado para ela e para ele, com os percentuais).
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
| Perguntas, alternativas, nomes em votação e seus conceitos | `js/config.js` (vale para a apresentação, o painel e a API) |
| Textos das lâminas | `index.html` |
| Visual — computador (1920×1080) e celular (seção "MODO CELULAR") | `css/deck.css` |
| Temas do mockup de conteúdo (lâmina 15) | `js/deck.js` → `THEMES` |
| Pontos de detalhe (lâminas 07 e 10) | `js/deck.js` → `HOTS` |
| Imagens dos personagens | `assets/maia/` (ela) e `assets/otto/` (ele) — veja `docs/IMAGENS.md` |

## Estrutura

```
index.html           apresentação + questionário (18 lâminas)
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
dev-server.mjs       servidor local
```

## Privacidade

São gravados apenas: nome, as respostas e um identificador aleatório do aparelho.
O painel e a exportação exigem a senha da equipe. As páginas não são indexadas por buscadores (`noindex`).
