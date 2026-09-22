import { NextResponse } from "next/server";
import { parseTransaction } from "@/lib/parser";
import { createTransactions } from "@/lib/transactions";
import { brl, fmtDate } from "@/lib/format";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const message = String(body?.message ?? "").slice(0, 300);
  const parsed = parseTransaction(message);

  if (!parsed) {
    return NextResponse.json({
      saved: false,
      reply: "Não encontrei um valor na frase. Tente “Gastei 45 no mercado hoje”, “Recebi 1.500 de salário” ou “Comprei tênis 300 em 3x”.",
    });
  }

  const created = await createTransactions({ ...parsed, accountId: null });
  const first = created[0];
  const label = first.type === "INCOME" ? "Receita" : "Despesa";
  const reply =
    created.length > 1
      ? `${label} parcelada registrada: ${created.length}x de ${brl(first.amount)} em ${first.category}, a partir de ${fmtDate(first.date)}.`
      : `${label} de ${brl(first.amount)} registrada em ${first.category} (${fmtDate(first.date)}): ${first.description}.`;
  return NextResponse.json({ saved: true, count: created.length, reply });
}
