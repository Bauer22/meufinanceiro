import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bad, num, oneOf, str } from "@/lib/validate";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const b = await req.json().catch(() => null);
  if (!b) return bad("Dados inválidos");
  const data: Prisma.AccountUpdateInput = {};
  if ("name" in b) { const v = str(b.name, 60); if (!v) return bad("Nome inválido"); data.name = v; }
  if ("type" in b) { const v = oneOf(b.type, ["CHECKING", "CASH", "CARD"] as const); if (!v) return bad("Tipo inválido"); data.type = v; }
  if ("initialBalance" in b) { const v = num(b.initialBalance); if (v === null) return bad("Saldo inválido"); data.initialBalance = v; }
  try {
    return NextResponse.json(await prisma.account.update({ where: { id: params.id }, data }));
  } catch {
    return bad("Conta não encontrada", 404);
  }
}

// Os lançamentos da conta ficam no histórico, apenas sem conta.
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.account.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Conta não encontrada", 404);
  }
}
