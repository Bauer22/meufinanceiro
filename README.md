# Meu Financeiro

Next.js 14 + Tailwind + Prisma (PostgreSQL). Cotações USD/EUR via AwesomeAPI.

## Rodar local
1. `cp .env.example .env` e preencha `DATABASE_URL` (Neon, Supabase ou Vercel Postgres).
2. `npm install`
3. `npx prisma db push`
4. `npm run dev` e abra http://localhost:3000

## Deploy na Vercel
Suba o projeto no GitHub, importe na Vercel e cadastre `DATABASE_URL` nas variáveis de ambiente.
Rode `npx prisma db push` uma vez apontando para o banco de produção.

## Chat
Interpreta frases por regras (src/lib/parser.ts): valor, tipo (receita/despesa), categoria e data (hoje, ontem, dd/mm).
Teste: `npm run test:parser`.

## Atenção
Não há login: qualquer pessoa com a URL vê e altera os dados. Proteja antes de publicar (ex.: NextAuth ou senha via middleware).
