import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { keyOf, monthBounds, todayParts } from "@/lib/dates";
import { bad, oneOf, posNum, str } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await prisma.recurring.findMany({ orderBy: [{ active: "desc" }, { dayOfMonth: "asc" }], include: { account: { select: { name: true } } } }),
  );
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const description = str(b?.description, 120);
  const amount = posNum(b?.amount);
  const type = oneOf(b?.type, ["INCOME", "EXPENSE"] as const);
  const dayOfMonth = Math.floor(Number(b?.dayOfMonth));
  if (!description || !amount || !type || !(dayOfMonth >= 1 && dayOfMonth <= 31)) return bad("Dados inválidos");

  const t = todayParts();
  const startMonth = typeof b?.startMonth === "string" && monthBounds(b.startMonth) ? b.startMonth : keyOf(t.y, t.m);
  const accountId = typeof b?.accountId === "string" && b.accountId ? b.accountId : null;

  const created = await prisma.recurring.create({
    data: { description, amount, type, category: str(b?.category, 40) ?? "Outros", dayOfMonth, startMonth, accountId },
  });
  return NextResponse.json(created, { status: 201 });
}
