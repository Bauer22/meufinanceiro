import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMonths, daysInMonth, keyOf, todayParts, utcNoon } from "@/lib/dates";

// Gera os lançamentos recorrentes que já venceram e ainda não existem.
// Idempotente: a chave única (recurringId, recurringMonth) impede duplicar, mesmo com chamadas simultâneas.
export async function POST() {
  const t = todayParts();
  const nowKey = keyOf(t.y, t.m);
  const list = await prisma.recurring.findMany({ where: { active: true } });

  const rows = [];
  for (const r of list) {
    const [sy, sm] = r.startMonth.split("-").map(Number);
    if (!sy || !sm || r.startMonth > nowKey) continue;
    for (let i = 0; i < 60; i++) {
      const { y, m } = addMonths(sy, sm, i);
      const key = keyOf(y, m);
      if (key > nowKey) break;
      const day = Math.min(r.dayOfMonth, daysInMonth(y, m));
      if (key === nowKey && day > t.d) break; // ainda não venceu neste mês
      rows.push({
        description: r.description,
        amount: r.amount,
        type: r.type,
        category: r.category,
        date: utcNoon(y, m, day),
        accountId: r.accountId,
        recurringId: r.id,
        recurringMonth: key,
      });
    }
  }

  const result = rows.length ? await prisma.transaction.createMany({ data: rows, skipDuplicates: true }) : { count: 0 };
  return NextResponse.json({ created: result.count });
}
