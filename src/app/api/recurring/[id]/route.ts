import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bad, oneOf, posNum, str } from "@/lib/validate";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json().catch(() => null);
  if (!b) return bad("Dados inválidos");
  const data: Prisma.RecurringUncheckedUpdateInput = {};
  if ("active" in b) data.active = !!b.active;
  if ("description" in b) { const v = str(b.description, 120); if (!v) return bad("Descrição inválida"); data.description = v; }
  if ("amount" in b) { const v = posNum(b.amount); if (!v) return bad("Valor inválido"); data.amount = v; }
  if ("type" in b) { const v = oneOf(b.type, ["INCOME", "EXPENSE"] as const); if (!v) return bad("Tipo inválido"); data.type = v; }
  if ("category" in b) { const v = str(b.category, 40); if (!v) return bad("Categoria inválida"); data.category = v; }
  if ("dayOfMonth" in b) { const v = Math.floor(Number(b.dayOfMonth)); if (!(v >= 1 && v <= 31)) return bad("Dia inválido"); data.dayOfMonth = v; }
  try {
    return NextResponse.json(await prisma.recurring.update({ where: { id: params.id }, data }));
  } catch {
    return bad("Recorrência não encontrada", 404);
  }
}

// Os lançamentos já gerados permanecem no histórico.
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.recurring.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Recorrência não encontrada", 404);
  }
}
