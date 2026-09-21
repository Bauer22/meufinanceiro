import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CURRENCIES = ["BRL", "USD", "EUR"];

export async function GET() {
  return NextResponse.json(await prisma.investment.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount);
  if (!body?.name || !Number.isFinite(amount) || amount <= 0 || !CURRENCIES.includes(body?.currency)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const created = await prisma.investment.create({
    data: { name: String(body.name), amount, currency: body.currency },
  });
  return NextResponse.json(created, { status: 201 });
}
