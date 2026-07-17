# Kongs Campeonatos

Sistema web de gestão de campeonatos de futebol, com 4 papéis de acesso:

- **Organização (admin)**: cria/edita campeonatos, times, técnicos, jogadores
  e jogos; convida donos de time. Papel atribuído manualmente (nunca por
  auto-cadastro) — veja `supabase/migrations/20260716132913_*.sql`.
- **Dono do time**: login por convite, edita apenas o próprio time/elenco em
  `/meu-time`. Vê jogos/classificação, mas não edita.
- **Jogador** e **Torcida**: sem login, páginas públicas somente leitura em
  `/campeonato/[id]` (campeonato inteiro) e `/campeonato/[id]/time/[teamId]`
  (elenco de um time).
- **Conta pública (qualquer pessoa que se cadastrar)**: não é dono de time
  nem admin. Ao logar cai em `/inicio`, um painel com menu lateral
  (Campeonatos / Perfil / Configurações / Sair). A aba Campeonatos lista
  todos os campeonatos; Perfil guarda nome, sobrenome, telefone, foto
  (upload real via Supabase Storage, bucket `avatars`) e persona
  (jogador/treinador/torcedor); Configurações troca a senha. Essa conta pode
  comentar nas páginas públicas dos campeonatos — mas não pode criar/editar
  nada.

Todos os dados ficam no Supabase (Postgres), protegidos por Row Level
Security de acordo com o papel do usuário.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- [Supabase](https://supabase.com) (Postgres + Auth) via `@supabase/ssr`

Não há nenhuma persistência local (SQLite, arquivos JSON, localStorage): toda
leitura/escrita passa pelas tabelas do Supabase, com Row Level Security
garantindo que cada organizador só veja os campeonatos que criou.

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env.local` (veja `.env.example`) com as credenciais do
   seu projeto Supabase:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   ```

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

## Banco de dados

O schema (tabelas `championships`, `coaches`, `teams`, `players`, `games` e
as políticas de RLS) está em `supabase/migrations/`. Para aplicar em um novo
projeto Supabase, rode o SQL desse arquivo no SQL Editor do painel do
Supabase, ou use a Supabase CLI:

```bash
supabase db push
```

## Deploy

O projeto é stateless e pode ser publicado em qualquer plataforma que rode
Next.js (Vercel, Netlify, etc.). Configure as mesmas variáveis de ambiente
(`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`) na plataforma
de deploy, e em Supabase > Authentication > URL Configuration adicione a URL
de produção às Redirect URLs (necessário para login por link mágico e
confirmação de e-mail).

## Login com Google

O botão "Continuar com Google" já está implementado no app, mas o provedor
precisa ser habilitado manualmente (uma vez só) no painel do Supabase, pois
exige credenciais do Google Cloud que só o dono da conta pode gerar:

1. Crie um OAuth Client ID em
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (tipo "Web application"). Em "Authorized redirect URIs" adicione:
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
2. No painel do Supabase, vá em **Authentication → Sign In / Providers →
   Google**, ative e cole o Client ID e o Client Secret gerados.

## Convite de dono de time

O fluxo de convite (`Convidar dono` na tela de Times) não usa a chave de
service role: ele grava um convite pendente e chama
`supabase.auth.signInWithOtp`, que cria a conta (se não existir) e envia um
link de acesso por e-mail. Ao entrar (por esse link, por senha, ou pelo
Google, usando o mesmo e-mail convidado), o sistema vincula automaticamente o
usuário ao time via a função `accept_team_invite` (valida no próprio banco
que o e-mail do convite bate com o do usuário autenticado).

## Funcionalidades adicionais

- **Esqueci minha senha**: link na tela de login, reaproveita `/auth/callback`
  e a página `/redefinir-senha` (também usada em `/meu-time/conta`).
- **Gerador de rodadas**: na aba Jogos, cria automaticamente os confrontos
  todos-contra-todos (turno único ou ida e volta).
- **Súmula digital**: cada jogo tem um painel de Súmula (aba Jogos → "Súmula")
  onde o admin lança placar final, gols e cartões — é a única fonte de dados
  da gamificação. O painel também gera um link público (`/sumula/[token]`,
  sem login) para enviar aos mesários preencherem ao vivo no dia do jogo; o
  token fica numa tabela própria sem policy de leitura (só acessível via
  funções `sumula_*`, SECURITY DEFINER), então não vaza pela leitura pública
  de `games`. "Gerar novo link" invalida o anterior. Artilharia/cartões
  aparecem em tabelas em Estatísticas (admin) e na página pública do
  campeonato.
- **Fase de grupos**: times podem receber um campo "Grupo" opcional; a
  classificação passa a ser calculada por grupo quando ao menos um time tiver
  grupo definido.
- **Chaveamento**: `/campeonato/[id]/chaveamento` mostra os jogos agrupados
  por rodada/fase, ordenados pela data mais próxima — é só visualização, não
  faz avanço automático de vencedor para a próxima fase.
- **Exportar classificação como imagem**: botão na página pública do
  campeonato, gera um PNG da tabela via `html2canvas-pro`.
- **CI**: `.github/workflows/ci.yml` roda typecheck, lint, testes (Vitest) e
  build a cada push/PR.
- **Formato do campeonato**: definido na criação (aba "Campeonatos") ou depois
  em `/campeonatos/[id]/configuracoes` — **Copa** calcula uma classificação
  separada por grupo (campo "Grupo" dos times); **Liga** sempre usa uma
  tabela única, ignorando o grupo. Em ambos, dá pra ligar/desligar a opção
  "mata-mata", que só controla se o link "Ver chaveamento" aparece.
- **Regras de disciplina**: o número de cartões amarelos que suspende o
  jogador para a próxima partida é configurável por campeonato (padrão 3,
  em Configurações); cartão vermelho sempre suspende. O cálculo
  (`src/lib/discipline.ts`) é informativo — não há controle de escalação
  no sistema — e aparece como coluna "Situação" em Estatísticas (admin) e
  como badge "Suspenso" no elenco público do time.
- **Comentários públicos**: na página pública de cada campeonato, usuários
  logados podem comentar (usa `championship_comments`); comentários mostram
  nome/foto/persona do perfil de quem comentou, quando preenchidos. Visitante
  sem conta vê os comentários mas precisa entrar para escrever. Há também um
  botão "Compartilhar" (Web Share API com fallback para copiar o link).
- **Cadastro vinculado ao time**: jogadores e técnicos não têm mais abas
  próprias — são cadastrados dentro da aba Times, num painel "Elenco"
  expansível por time (cria/edita/remove jogadores e técnico ali mesmo).
- **Upload real de imagem**: escudo do time (`crests`), foto de perfil
  (`avatars`) e foto do jogador (`player-photos`) são upload de arquivo de
  verdade (Supabase Storage), não mais campos de URL.
- **Datas de jogo só após o sorteio**: o formulário de agendar jogo manual
  só libera o campo de data depois que a competição já tem pelo menos um
  jogo (ou seja, depois de gerar/sortear os confrontos), reforçado também
  no servidor.
- **Página pública em abas**: `/campeonato/[id]` virou 4 abas (Visão Geral,
  Classificação, Partidas, Estatísticas) com um filtro por time em
  Partidas/Estatísticas; visitantes logados veem o mesmo menu lateral do
  `/inicio` fixo enquanto navegam.

## Gamificação (cartas estilo FIFA)

Cada jogador tem uma carta com OVR e 6 atributos (Ritmo, Finalização, Passe,
Drible, Defesa, Físico), todos começando em 70 — sem autoavaliação nem input
manual, a evolução vem só do desempenho em campo. Raridade da carta: Bronze
(OVR < 70), Prata (70–79), Ouro (80+).

A única fonte de dados para a evolução é a súmula do jogo (gols, cartões e
placar, lançados na aba Jogos → "Súmula" ou pelo link público de súmula +
marcar "Jogo realizado"). Ao salvar o placar (ou editar gols/cartões depois),
a função SQL `process_game_ovr` (SECURITY DEFINER, porte de
`src/lib/gamification.ts` — mesmas fórmulas, com testes em
`gamification.test.ts`) recalcula tudo do zero de forma idempotente — reverte
o lançamento anterior daquele jogo e aplica de novo com os dados atuais.
Rodar como função SQL (em vez de código do servidor Next.js) é o que permite
o link público de súmula funcionar sem login e sem precisar de uma chave de
service role:

- `Base = Gols×0.30 + Vitória×0.20 − Amarelos×0.15 − Vermelhos×0.50`
- Atacantes/Meias/Laterais/Volantes: `ΔOVR = Base`
- Zagueiros: `ΔOVR = Base + (3.5 − Gols sofridos)×0.15`
- Goleiros: `ΔOVR = Base + (3.5 − Gols sofridos)×0.25`

Cada motivo gera uma linha no histórico (`ovr_history`, público para leitura)
exibida na carta como "+0.30 · 1 Gol". O craque da partida (`mvp_player_id`
em `games`) é automaticamente quem tiver o maior ΔOVR no jogo.

Na página pública de cada time (`/campeonato/[id]/time/[teamId]`), o elenco
aparece como cartas clicáveis; ao abrir uma, toca uma animação simples de
"abertura de pacote" antes de mostrar o histórico de evolução, a contagem de
MVPs e um botão para baixar a carta como imagem. Na aba Estatísticas há
também um **Comparador de jogadores** (duas cartas lado a lado, destacando em
verde o atributo maior) e o **Time da Rodada** (1 Goleiro, 2 Zagueiros, 2
Meias, 1 Atacante — os de maior ΔOVR somado naquela rodada; ver
`src/lib/team-of-the-round.ts`).

## Múltiplos admins por campeonato (co-organizadores)

A base de dados já suporta isso — tabela `championship_admins` e a função
`is_championship_admin()` (usada em todas as policies de escrita) já aceitam
tanto o dono original quanto qualquer usuário listado nessa tabela para o
mesmo campeonato. **Ainda não existe uma tela para gerenciar isso** (só dá
para adicionar um co-admin rodando um `insert` direto no Supabase). Se for
usar isso de verdade, também será preciso ajustar o redirecionamento
pós-login e a listagem "/campeonatos" para considerar campeonatos
co-administrados, não só os que o usuário é dono — avise que eu implemento
essa parte.
