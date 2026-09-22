import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { keyOf, monthBounds, todayParts } from "@/lib/dates";
import { bad, posNum, str } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const t = todayParts();
  const key = new URL(req.url).searchParams.get("month") ?? keyOf(t.y, t.m);
  const b = monthBounds(key);
  if (!b) return bad("Mês inválido");

  const [budgets, spent] = await Promise.all([
    prisma.budget.findMany({ orderBy: { category: "asc" } }),
    prisma.transaction.groupBy({
      by: ["category"],
      where: { type: "EXPENSE", date: { gte: b.start, lt: b.end } },
      _sum: { amount: true },
    }),
  ]);
  const spentOf = (c: string) => spent.find((s) => s.category === c)?._sum.amount ?? 0;
  return NextResponse.json({
    month: key,
    items: budgets.map((x) => ({ ...x, spent: spentOf(x.category) })),
    // gastos em categorias sem orçamento definido
    unbudgeted: spent.filter((s) => !budgets.some((x) => x.category === s.category)).map((s) => ({ category: s.category, spent: s._sum.amount ?? 0 })),
  });
}

// Cria ou atualiza o limite de uma categoria.
export async function PUT(req: Request) {
  const b = await req.json().catch(() => null);
  const category = str(b?.category, 40);
  const limit = posNum(b?.limit);
  if (!category || !limit) return bad("Dados inválidos");
  return NextResponse.json(
    await prisma.budget.upsert({ where: { category }, update: { limit }, create: { category, limit } }),
  );
}
