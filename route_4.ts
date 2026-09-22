import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { daysInMonth, monthBounds, utcNoon } from "@/lib/dates";
import { bad } from "@/lib/validate";

export const dynamic = "force-dynamic";

// Combina tarefas/contas avulsas (Task) com as ocorrências do mês dos lançamentos
// recorrentes (Recurring), só para exibição — não altera nada no banco.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthKey = searchParams.get("month");
  const bounds = monthKey ? monthBounds(monthKey) : null;
  if (!bounds || !monthKey) return bad("Mês inválido (use YYYY-MM)");

  const [tasks, recurrings] = await Promise.all([
    prisma.task.findMany({ where: { dueDate: { gte: bounds.start, lt: bounds.end } }, orderBy: { dueDate: "asc" } }),
    prisma.recurring.findMany({
      where: { active: true, startMonth: { lte: monthKey } },
      include: { account: { select: { name: true } } },
      orderBy: { dayOfMonth: "asc" },
    }),
  ]);

  const [y, m] = monthKey.split("-").map(Number);
  const dim = daysInMonth(y, m);

  const recurringOccurrences = recurrings.map((r) => ({
    id: `rec-${r.id}-${monthKey}`,
    recurringId: r.id,
    description: r.description,
    amount: r.amount,
    type: r.type,
    category: r.category,
    account: r.account,
    dueDate: utcNoon(y, m, Math.min(r.dayOfMonth, dim)).toISOString(),
  }));

  return NextResponse.json({ tasks, recurringOccurrences });
}
