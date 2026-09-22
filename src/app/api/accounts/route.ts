import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayParts, utcNoon } from "@/lib/dates";
import { bad, num, oneOf, str } from "@/lib/validate";

export const dynamic = "force-dynamic";
const ACCOUNT_TYPES = ["CHECKING", "CASH", "CARD"] as const;


export async function GET() {
  const t = todayParts();
  const until = utcNoon(t.y, t.m, t.d);
  const [accounts, sums] = await Promise.all([
    prisma.account.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.transaction.groupBy({ by: ["accountId", "type"], where: { accountId: { not: null }, date: { lte: until } }, _sum: { amount: true } }),
  ]);
  const s = (id: string, ty: string) => sums.find((x) => x.accountId === id && x.type === ty)?._sum.amount ?? 0;
  return NextResponse.json(
    accounts.map((a) => ({ ...a, balance: a.initialBalance + s(a.id, "INCOME") - s(a.id, "EXPENSE") })),
  );
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const name = str(b?.name, 60);
  const type = oneOf(b?.type ?? "CHECKING", ACCOUNT_TYPES);
  const initialBalance = b?.initialBalance === undefined || b?.initialBalance === "" ? 0 : num(b.initialBalance);
  if (!name || !type || initialBalance === null) return bad("Dados inválidos");
  return NextResponse.json(await prisma.account.create({ data: { name, type, initialBalance } }), { status: 201 });
}
