import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseISODate } from "@/lib/dates";
import { bad, oneOf, posNum, str } from "@/lib/validate";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json().catch(() => null);
  if (!b) return bad("Dados inválidos");
  const data: Prisma.TaskUncheckedUpdateInput = {};

  if ("done" in b) data.done = !!b.done;
  if ("title" in b) { const v = str(b.title, 120); if (!v) return bad("Título inválido"); data.title = v; }
  if ("dueDate" in b) { const v = parseISODate(b.dueDate); if (!v) return bad("Data inválida"); data.dueDate = v; }
  if ("kind" in b) { const v = oneOf(b.kind, ["TASK", "BILL"] as const); if (!v) return bad("Tipo inválido"); data.kind = v; }
  if ("notes" in b) data.notes = typeof b.notes === "string" ? (str(b.notes, 300) ?? undefined) : null;
  if ("amount" in b) {
    if (b.amount == null || b.amount === "") data.amount = null;
    else { const v = posNum(b.amount); if (v == null) return bad("Valor inválido"); data.amount = v; }
  }

  try {
    return NextResponse.json(await prisma.task.update({ where: { id: params.id }, data }));
  } catch {
    return bad("Item não encontrado", 404);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Item não encontrado", 404);
  }
}
