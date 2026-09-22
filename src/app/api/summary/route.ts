import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRates, rateFor } from "@/lib/rates";
import { keyOf, monthBounds, todayParts, utcNoon } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Row = { type: string; _sum: { amount: number | null } };
const sum = (rows: Row[], type: string) => rows.find((r) => r.type === type)?._sum.amount ?? 0;

export async function GET() {
  const today = todayParts();
  const bounds = monthBounds(keyOf(today.y, today.m))!;
  const untilToday = utcNoon(today.y, today.m, today.d);

  const [upToToday, month, accounts, investments, budgets, spentByCat, rates] = await Promise.all([
    prisma.transaction.groupBy({ by: ["type"], where: { date: { lte: untilToday } }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ["type"], where: { date: { gte: bounds.start, lt: bounds.end } }, _sum: { amount: true } }),
    prisma.account.aggregate({ _sum: { initialBalance: true } }),
    prisma.investment.findMany(),
    prisma.budget.findMany(),
    prisma.transaction.groupBy({
      by: ["category"],
      where: { type: "EXPENSE", date: { gte: bounds.start, lt: bounds.end } },
      _sum: { amount: true },
    }),
    getRates(),
  ]);

  let invCurrent = 0;
  let invCost = 0;
  let invKnown = true;
  for (const i of investments) {
    const now = rateFor(rates, i.currency);
    invCurrent += i.amount * (now ?? i.rateAtEntry ?? 1);
    if (i.rateAtEntry == null) invKnown = false;
    else invCost += i.amount * i.rateAtEntry;
  }

  const alerts = budgets
    .map((b) => ({ category: b.category, limit: b.limit, spent: spentByCat.find((s) => s.category === b.category)?._sum.amount ?? 0 }))
    .filter((b) => b.spent >= b.limit * 0.8)
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit);

  return NextResponse.json({
    balance: (accounts._sum.initialBalance ?? 0) + sum(upToToday, "INCOME") - sum(upToToday, "EXPENSE"),
    income: sum(month, "INCOME"),
    expense: sum(month, "EXPENSE"),
    investments: invCurrent,
    investmentsGain: invKnown ? invCurrent - invCost : null,
    ratesOk: !!rates,
    alerts,
  });
}
