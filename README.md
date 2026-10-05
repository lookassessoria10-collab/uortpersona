# UORT · Vamos construir o DNA da Maia

Experiência interativa da **LOOK Assessoria de Comunicação** para a **UORT — Ortopedia e Traumatologia**.
Cada sócio ou colaborador recebe **um link**, percorre a apresentação no celular ou no computador e responde
**9 escolhas rápidas** ali mesmo. As respostas são salvas automaticamente; **só a equipe vê o resultado**,
no painel protegido por senha.

| Endereço | Para quem | O que faz |
|---|---|---|
| `/` | Quem recebe o link | Apresentação + questionário (celular e computador) |
| `/resultados` | Equipe LOOK / UORT (com senha) | Gráficos por pergunta, filtros, tabela e exportação CSV |

Site estático (HTML, CSS e JavaScript puros, sem build) + três funções serverless na Vercel para gravar as respostas.

---

## Roteiro

| # | Lâmina | O que acontece |
|---|---|---|
| 01 | Tem alguém novo chegando à UORT | Teaser (silhueta e detalhes). Toque revela "ela não atende consultas…" |
| 02 | Por que criar essa personagem? | Toque revela os limites: não é médica, não diagnostica, não substitui |
| 03 | Antes de começar | A pessoa diz como participa da UORT (sócio, colaborador, outro) e, se quiser, o nome |
| 04 | **Escolha 01** · Papel | Anfitriã · Guia · Comunicadora |
| 05 | **Escolha 02** · Jeito de falar | Três mensagens de chat: qual soa mais como a UORT? |
| 06 | **Escolha 03** · Esta ou aquela | Quatro pares em sequência rápida (humor, explicação, emoji, conversa) |
| 07 | **Escolha 04** · DNA | Até 3 de 12 características, com a hélice acendendo |
| 08 | Antes de mostrar quem é… | Resume as escolhas da pessoa e prepara a revelação |
| 09 | Revelação: **MAIA** | Transição especial. Toque: as letras viram M·A·I·A |
| 10 | Quem é a Maia? | Pontos de detalhe na figura. Toque revela a regra de consistência |
| 11 | **Escolha 05** · Versões | Profissional · Dia a dia · Movimento · Digital |
| 12 | **Escolha 06** · Cabelo e expressão | Seis penteados |
| 13 | Maia em situações reais | Mosaico (toque amplia a foto) |
| 14 | **Escolha 07** · Onde aparecer primeiro | Até 2 de 10 canais |
| 15 | **Escolha 08** · Tipo de conversa | Até 2 de 6 temas |
| 16 | Como isso vira conteúdo? | Mockup de post em carrossel: Maia pergunta → especialista explica → próximo passo |
| 17 | **Escolha 09** · Primeiro conteúdo | A mais escolhida por todos vira candidata real à estreia |
| 18 | Suas escolhas | Resumo das respostas da pessoa, com "Alterar" / "Responder" |
| 19 | Encerramento | Toque fecha com Movimento · Acolhimento · Informação · Acesso |

**Como funciona para quem responde**
- No celular, cada lâmina vira uma tela vertical que rola. Botões grandes embaixo; também dá para deslizar para os lados.
- O botão principal mostra **Pular** enquanto a pergunta não foi respondida e **Próxima** depois. A barra de baixo indica **✓ Resposta salva**.
- Não existe botão de enviar: cada escolha é gravada na hora. Sem internet, a resposta fica guardada no aparelho e é reenviada depois.
- Ao voltar ao link, continua de onde parou. Na lâmina 18 dá para alterar qualquer resposta.
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

### Rodadas (opcional)

Todas as respostas entram na rodada `principal`. Para separar grupos, envie links diferentes:
`https://SEU-ENDERECO.vercel.app/?sessao=socios` e `…/?sessao=colaboradores`.
No painel, cada rodada aparece separada (ou somadas em "Todas as rodadas").

---

## Medir (`/resultados`)

- **Indicadores:** participantes, quem respondeu tudo, quem parou no meio e participantes por perfil.
- **Gráfico por pergunta:** escolhas, percentual sobre quem respondeu e a mais escolhida.
  "Esta ou aquela" aparece como barra dividida A × B para cada par.
- **Filtros:** rodada e perfil (sócios × colaboradores × outros).
- **Tabela** com cada resposta individual (data, nome, perfil, pergunta, resposta) e busca.
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
| Perguntas, alternativas, mensagens de exemplo, pares "esta ou aquela", perfis | `js/config.js` (vale para a apresentação, o painel e a API) |
| Textos das lâminas | `index.html` |
| Visual — computador (1920×1080) e celular (seção "MODO CELULAR") | `css/deck.css` |
| Temas do mockup de conteúdo (lâmina 16) | `js/deck.js` → `THEMES` |
| Imagens da personagem | `assets/maia/` — veja `docs/IMAGENS.md` |

## Estrutura

```
index.html           apresentação + questionário (19 lâminas)
resultados.html      painel da equipe
css/                 base.css · deck.css · resultados.css
js/config.js         perguntas (fonte única)
js/deck.js           apresentação, questionário e salvamento automático
js/resultados.js     painel e exportação
js/client.js         chamadas à API, identificação do aparelho, fila offline
api/                 vote · results · status (funções da Vercel)
lib/                 armazenamento (Upstash Redis / memória) e utilitários HTTP
assets/maia/         imagens da personagem
dev-server.mjs       servidor local
```

## Privacidade

São gravados apenas: nome (opcional), perfil, as respostas e um identificador aleatório do aparelho.
O painel e a exportação exigem a senha da equipe. As páginas não são indexadas por buscadores (`noindex`).
