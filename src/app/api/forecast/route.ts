import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMonths, keyOf, monthBounds, monthKey, todayParts } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Previsão dos próximos 3 meses (não inclui o mês atual, que já aparece em /api/summary).
// Soma o que já está de fato programado: lançamentos com data futura já cadastrados
// (por exemplo, parcelas) + as ocorrências que os recorrentes ativos vão gerar em cada mês.
// Não é média histórica — é o compromisso já conhecido.
export async function GET() {
  const t = todayParts();
  const targets = [1, 2, 3].map((n) => addMonths(t.y, t.m, n));
  const keys = targets.map(({ y, m }) => keyOf(y, m));

  const start = monthBounds(keys[0])!.start;
  const end = monthBounds(keys[keys.length - 1])!.end;

  const [rows, recurrings] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: start, lt: end } },
      select: { amount: true, type: true, date: true },
    }),
    prisma.recurring.findMany({ where: { active: true }, select: { amount: true, type: true, startMonth: true } }),
  ]);

  const months = keys.map((month) => ({ month, income: 0, expense: 0 }));
  const idx = new Map(keys.map((k, i) => [k, i]));

  // Lançamentos já cadastrados com data dentro da janela (parcelas futuras, por exemplo).
  for (const r of rows) {
    const i = idx.get(monthKey(r.date));
    if (i === undefined) continue;
    if (r.type === "INCOME") months[i].income += r.amount;
    else months[i].expense += r.amount;
  }

  // Ocorrências futuras dos recorrentes ativos (ainda não viram Transaction até o dia chegar).
  for (const rec of recurrings) {
    for (let i = 0; i < keys.length; i++) {
      if (rec.startMonth > keys[i]) continue;
      if (rec.type === "INCOME") months[i].income += rec.amount;
      else months[i].expense += rec.amount;
    }
  }

  return NextResponse.json({
    months: months.map((m) => ({
      month: m.month,
      income: Math.round(m.income * 100) / 100,
      expense: Math.round(m.expense * 100) / 100,
      net: Math.round((m.income - m.expense) * 100) / 100,
    })),
  });
}
