# Kongs Campeonatos

Sistema web de gestão de campeonatos de futebol. Cada organizador cria e
gerencia seus próprios campeonatos (times, técnicos, jogadores, jogos e
classificação automática), com todos os dados armazenados no Supabase
(Postgres) e protegidos por Row Level Security.

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
