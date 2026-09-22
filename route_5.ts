import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { keyOf, todayParts, utcNoon } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Resumo do dia para o alerta no dashboard: afazeres/contas de hoje, atrasados e
// contas recorrentes que vencem hoje. O saldo já vem de /api/summary.
export async function GET() {
  const t = todayParts();
  const today = utcNoon(t.y, t.m, t.d);
  const monthKey = keyOf(t.y, t.m);

  const [dueToday, overdue, recurringToday] = await Promise.all([
    prisma.task.findMany({ where: { done: false, dueDate: today }, orderBy: { title: "asc" } }),
    prisma.task.findMany({ where: { done: false, dueDate: { lt: today } }, orderBy: { dueDate: "asc" } }),
    prisma.recurring.findMany({
      where: { active: true, dayOfMonth: t.d, startMonth: { lte: monthKey } },
      include: { account: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({ dueToday, overdue, recurringToday });
}
