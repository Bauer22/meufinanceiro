import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMonths, keyOf, monthBounds, monthKey, todayParts } from "@/lib/dates";

export const dynamic = "force-dynamic";

// ?from=YYYY-MM&to=YYYY-MM  (padrão: últimos 6 meses)  ou  ?months=3|6|12
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const t = todayParts();
  const months = Math.min(Math.max(parseInt(sp.get("months") ?? "6", 10) || 6, 1), 24);

  const toKey = sp.get("to") && monthBounds(sp.get("to")!) ? sp.get("to")! : keyOf(t.y, t.m);
  const toB = monthBounds(toKey)!;
  const defFrom = addMonths(toB.start.getUTCFullYear(), toB.start.getUTCMonth() + 1, -(months - 1));
  const fromKey = sp.get("from") && monthBounds(sp.get("from")!) ? sp.get("from")! : keyOf(defFrom.y, defFrom.m);
  const fromB = monthBounds(fromKey)!;
  if (fromB.start > toB.start) return NextResponse.json({ error: "Período inválido" }, { status: 400 });

  const [rows, opening, accounts] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: fromB.start, lt: toB.end } },
      select: { amount: true, type: true, category: true, date: true, description: true },
    }),
    prisma.transaction.groupBy({ by: ["type"], where: { date: { lt: fromB.start } }, _sum: { amount: true } }),
    prisma.account.aggregate({ _sum: { initialBalance: true } }),
  ]);

  // lista de meses do período
  const keys: string[] = [];
  for (let k = fromB.start; k < toB.end; ) {
    keys.push(monthKey(k));
    k = new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth() + 1, 1));
  }

  const monthly = keys.map((month) => ({ month, income: 0, expense: 0 }));
  const idx = new Map(keys.map((k, i) => [k, i]));
  const cat = new Map<string, number>();
  let income = 0;
  let expense = 0;

  for (const r of rows) {
    const i = idx.get(monthKey(r.date));
    if (i === undefined) continue;
    if (r.type === "INCOME") { monthly[i].income += r.amount; income += r.amount; }
    else { monthly[i].expense += r.amount; expense += r.amount; cat.set(r.category, (cat.get(r.category) ?? 0) + r.amount); }
  }

  const openSum = (ty: string) => opening.find((o) => o.type === ty)?._sum.amount ?? 0;
  let running = (accounts._sum.initialBalance ?? 0) + openSum("INCOME") - openSum("EXPENSE");
  const balance = monthly.map((m) => {
    running += m.income - m.expense;
    return { month: m.month, value: Math.round(running * 100) / 100 };
  });

  const byCategory = Array.from(cat, ([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const topExpenses = rows
    .filter((r) => r.type === "EXPENSE")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((r) => ({ description: r.description, amount: r.amount, category: r.category, date: r.date }));

  return NextResponse.json({
    from: fromKey,
    to: toKey,
    totals: { income, expense, net: income - expense, avgExpense: expense / keys.length },
    monthly,
    balance,
    byCategory,
    topExpenses,
  });
}
