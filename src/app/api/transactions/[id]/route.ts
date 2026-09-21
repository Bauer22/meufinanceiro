import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.transaction.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }
}
