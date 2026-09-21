import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Retorna o resumo real do banco. Investimentos em USD/EUR são convertidos com as cotações recebidas.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const usd = Number(sp.get("usd")) || 1;
  const eur = Number(sp.get("eur")) || 1;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [all, month, investments] = await Promise.all([
    prisma.transaction.groupBy({ by: ["type"], _sum: { amount: true } }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { date: { gte: monthStart, lt: nextMonth } },
      _sum: { amount: true },
    }),
    prisma.investment.findMany(),
  ]);

  type Row = { type: string; _sum: { amount: number | null } };
  const sum = (rows: Row[], type: string) => rows.find((r) => r.type === type)?._sum.amount ?? 0;
  const rate = (c: string) => (c === "USD" ? usd : c === "EUR" ? eur : 1);

  return NextResponse.json({
    balance: sum(all, "INCOME") - sum(all, "EXPENSE"),
    income: sum(month, "INCOME"),
    expense: sum(month, "EXPENSE"),
    investments: investments.reduce((acc: number, i: { amount: number; currency: string }) => acc + i.amount * rate(i.currency), 0),
  });
}
