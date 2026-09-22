import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseISODate } from "@/lib/dates";
import { bad, num, posNum, str } from "@/lib/validate";

// { name?, target?, deadline?, deposit? }  — deposit soma (ou subtrai, se negativo) ao valor guardado.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json().catch(() => null);
  if (!b) return bad("Dados inválidos");
  const data: Prisma.GoalUpdateInput = {};
  if ("name" in b) { const v = str(b.name, 80); if (!v) return bad("Nome inválido"); data.name = v; }
  if ("target" in b) { const v = posNum(b.target); if (!v) return bad("Meta inválida"); data.target = v; }
  if ("deadline" in b) {
    if (b.deadline) { const v = parseISODate(b.deadline); if (!v) return bad("Prazo inválido"); data.deadline = v; }
    else data.deadline = null;
  }
  if ("deposit" in b) { const v = num(b.deposit); if (v === null || v === 0) return bad("Valor inválido"); data.saved = { increment: v }; }
  try {
    const g = await prisma.goal.update({ where: { id: params.id }, data });
    if (g.saved < 0) return NextResponse.json(await prisma.goal.update({ where: { id: g.id }, data: { saved: 0 } }));
    return NextResponse.json(g);
  } catch {
    return bad("Meta não encontrada", 404);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.goal.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Meta não encontrada", 404);
  }
}
