import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bad, posNum, str } from "@/lib/validate";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json().catch(() => null);
  if (!b) return bad("Dados inválidos");
  const data: Prisma.InvestmentUpdateInput = {};
  if ("name" in b) { const v = str(b.name, 80); if (!v) return bad("Nome inválido"); data.name = v; }
  if ("amount" in b) { const v = posNum(b.amount); if (!v) return bad("Valor inválido"); data.amount = v; }
  if ("rate" in b) { const v = posNum(b.rate); if (!v) return bad("Cotação inválida"); data.rateAtEntry = v; }
  try {
    return NextResponse.json(await prisma.investment.update({ where: { id: params.id }, data }));
  } catch {
    return bad("Investimento não encontrado", 404);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.investment.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Investimento não encontrado", 404);
  }
}
