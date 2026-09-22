# Meu Financeiro

Next.js 14 + Tailwind + Prisma (PostgreSQL/Neon). Cotações USD/EUR via AwesomeAPI.

## Funcionalidades
- **Login por senha** (cookie assinado, 30 dias). Sem `APP_PASSWORD` configurada, o app em produção responde 503.
- **Dashboard**: saldo, receitas/gastos do mês, investimentos com ganho/perda, alertas de orçamento.
- **Lançar (chat)**: "Gastei 45 no mercado hoje", "Recebi 1.500 de salário", "Comprei tênis 300 em 3x".
- **Lançamentos**: filtros (mês, tipo, categoria, conta, busca), edição, exclusão (parcela ou parcelamento inteiro), novo lançamento com parcelas, exportação CSV para Excel.
- **Relatórios**: receitas x despesas por mês, evolução do saldo, despesas por categoria, maiores despesas.
- **Metas**: orçamento mensal por categoria (alerta a 80% e ao estourar) e metas de economia.
- **Contas e cartões**: saldo por conta.
- **Recorrentes**: aluguel, assinaturas, salário — gerados sozinhos ao abrir o app.
- **Investimentos**: valor atual em R$ pela cotação do dia e ganho/perda desde o aporte.

## Rodar local
1. `cp .env.example .env` e preencha `DATABASE_URL`, `APP_PASSWORD` e `AUTH_SECRET`.
2. `npm install`
3. `npx prisma db push` (usa a URL **sem** `-pooler` do Neon)
4. `npm run dev` e abra http://localhost:3000
   (em desenvolvimento, sem `APP_PASSWORD`, o login é dispensado)

## Deploy na Vercel
Variáveis de ambiente: `DATABASE_URL` (URL com `-pooler`, terminando em `?sslmode=require`), `APP_PASSWORD` e `AUTH_SECRET`.
Depois de mudar o `prisma/schema.prisma`, rode `npx prisma db push` localmente contra o banco antes do deploy.

## Testes
`npm run test:parser` testa o interpretador de frases, datas e parcelas.

## Observações
- Datas dos lançamentos são guardadas ao meio-dia UTC do dia escolhido, e "hoje" usa o fuso de São Paulo.
- Dinheiro é guardado como número decimal (Float), suficiente para uso pessoal.
