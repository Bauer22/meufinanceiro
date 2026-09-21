import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? 20), 200);
  const items = await prisma.transaction.findMany({ orderBy: { date: "desc" }, take: limit });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount);
  if (!body?.description || !Number.isFinite(amount) || amount <= 0 || !["INCOME", "EXPENSE"].includes(body?.type)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const created = await prisma.transaction.create({
    data: {
      description: String(body.description),
      amount,
      type: body.type,
      category: String(body.category ?? "Outros"),
      date: body.date ? new Date(body.date) : new Date(),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
