import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseISODate } from "@/lib/dates";
import { bad, oneOf, posNum, str } from "@/lib/validate";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json().catch(() => null);
  if (!b) return bad("Dados inválidos");

  const data: Prisma.TransactionUncheckedUpdateInput = {};
  if ("description" in b) { const v = str(b.description, 120); if (!v) return bad("Descrição inválida"); data.description = v; }
  if ("amount" in b) { const v = posNum(b.amount); if (!v) return bad("Valor inválido"); data.amount = v; }
  if ("type" in b) { const v = oneOf(b.type, ["INCOME", "EXPENSE"] as const); if (!v) return bad("Tipo inválido"); data.type = v; }
  if ("category" in b) { const v = str(b.category, 40); if (!v) return bad("Categoria inválida"); data.category = v; }
  if ("date" in b) { const v = parseISODate(b.date); if (!v) return bad("Data inválida"); data.date = v; }
  if ("accountId" in b) {
    const id = typeof b.accountId === "string" && b.accountId ? b.accountId : null;
    if (id && !(await prisma.account.findUnique({ where: { id }, select: { id: true } }))) return bad("Conta não encontrada");
    data.accountId = id;
  }

  try {
    return NextResponse.json(await prisma.transaction.update({ where: { id: params.id }, data }));
  } catch {
    return bad("Lançamento não encontrado", 404);
  }
}

// ?scope=group apaga todas as parcelas do mesmo parcelamento.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const scope = new URL(req.url).searchParams.get("scope");
  try {
    if (scope === "group") {
      const tx = await prisma.transaction.findUnique({ where: { id: params.id }, select: { installmentGroup: true } });
      if (tx?.installmentGroup) {
        const r = await prisma.transaction.deleteMany({ where: { installmentGroup: tx.installmentGroup } });
        return NextResponse.json({ ok: true, deleted: r.count });
      }
    }
    await prisma.transaction.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, deleted: 1 });
  } catch {
    return bad("Lançamento não encontrado", 404);
  }
}
