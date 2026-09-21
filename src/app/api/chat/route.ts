import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTransaction } from "@/lib/parser";
import { brl } from "@/lib/format";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const message = String(body?.message ?? "");
  const parsed = parseTransaction(message);

  if (!parsed) {
    return NextResponse.json({
      saved: false,
      reply: "Não encontrei um valor na frase. Tente algo como “Gastei 45 no mercado hoje” ou “Recebi 1.500 de salário”.",
    });
  }

  const tx = await prisma.transaction.create({ data: parsed });
  const label = tx.type === "INCOME" ? "Receita" : "Despesa";
  return NextResponse.json({
    saved: true,
    transaction: tx,
    reply: `${label} de ${brl(tx.amount)} registrada em ${tx.category} (${tx.date.toLocaleDateString("pt-BR")}): ${tx.description}.`,
  });
}
