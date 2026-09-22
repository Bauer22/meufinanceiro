import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRates, rateFor } from "@/lib/rates";
import { bad, oneOf, posNum, str } from "@/lib/validate";

export const dynamic = "force-dynamic";
const CURRENCIES = ["BRL", "USD", "EUR"] as const;

export async function GET() {
  const [items, rates] = await Promise.all([prisma.investment.findMany({ orderBy: { createdAt: "desc" } }), getRates()]);
  return NextResponse.json({
    ratesOk: !!rates,
    items: items.map((i) => {
      const now = rateFor(rates, i.currency);
      const currentBRL = i.amount * (now ?? i.rateAtEntry ?? 1);
      const costBRL = i.rateAtEntry != null ? i.amount * i.rateAtEntry : null;
      return {
        ...i,
        currentBRL,
        costBRL,
        gainBRL: costBRL != null ? currentBRL - costBRL : null,
        gainPct: costBRL ? ((currentBRL - costBRL) / costBRL) * 100 : null,
      };
    }),
  });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const name = str(b?.name, 80);
  const amount = posNum(b?.amount);
  const currency = oneOf(b?.currency, CURRENCIES);
  if (!name || !amount || !currency) return bad("Dados inválidos");

  // Cotação do aporte: informada pelo usuário ou a atual.
  let rateAtEntry: number | null = currency === "BRL" ? 1 : posNum(b?.rate);
  if (rateAtEntry === null) rateAtEntry = rateFor(await getRates(), currency);

  return NextResponse.json(await prisma.investment.create({ data: { name, amount, currency, rateAtEntry } }), { status: 201 });
}
