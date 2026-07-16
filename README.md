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
