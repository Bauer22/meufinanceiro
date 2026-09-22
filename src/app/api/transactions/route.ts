import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildWhere } from "@/lib/filters";
import { createTransactions } from "@/lib/transactions";
import { parseISODate, todayParts, utcNoon } from "@/lib/dates";
import { bad, oneOf, posNum, str } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const where = buildWhere(sp);
  const limit = Math.min(Math.max(parseInt(sp.get("limit") ?? "50", 10) || 50, 1), 500);
  const page = Math.max(parseInt(sp.get("page") ?? "1", 10) || 1, 1);

  const [items, total, sums] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: (page - 1) * limit,
      include: { account: { select: { name: true } } },
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({ by: ["type"], where, _sum: { amount: true } }),
  ]);

  const sum = (t: string) => sums.find((s) => s.type === t)?._sum.amount ?? 0;
  return NextResponse.json({ items, total, page, limit, income: sum("INCOME"), expense: sum("EXPENSE") });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const description = str(b?.description, 120);
  const amount = posNum(b?.amount);
  const type = oneOf(b?.type, ["INCOME", "EXPENSE"] as const);
  if (!description || !amount || !type) return bad("Dados inválidos");

  const t = todayParts();
  const date = b?.date ? parseISODate(b.date) : utcNoon(t.y, t.m, t.d);
  if (!date) return bad("Data inválida");

  const installments = b?.installments ? Math.floor(Number(b.installments)) : 1;
  if (!Number.isFinite(installments) || installments < 1 || installments > 48) return bad("Parcelas devem ser de 1 a 48");

  const accountId = typeof b?.accountId === "string" && b.accountId ? b.accountId : null;
  if (accountId && !(await prisma.account.findUnique({ where: { id: accountId }, select: { id: true } }))) {
    return bad("Conta não encontrada");
  }

  const created = await createTransactions({
    description,
    amount,
    type,
    category: str(b?.category, 40) ?? "Outros",
    date,
    accountId,
    installments,
  });
  return NextResponse.json(created, { status: 201 });
}
