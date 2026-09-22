import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad } from "@/lib/validate";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.budget.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Orçamento não encontrado", 404);
  }
}
