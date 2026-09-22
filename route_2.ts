import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monthBounds, parseISODate } from "@/lib/dates";
import { bad, oneOf, posNum, str } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM", opcional
  const bounds = month ? monthBounds(month) : null;
  const where = bounds ? { dueDate: { gte: bounds.start, lt: bounds.end } } : {};
  return NextResponse.json(await prisma.task.findMany({ where, orderBy: [{ dueDate: "asc" }] }));
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const title = str(b?.title, 120);
  const kind = oneOf(b?.kind, ["TASK", "BILL"] as const) ?? "TASK";
  const dueDate = parseISODate(b?.dueDate);
  if (!title || !dueDate) return bad("Dados inválidos");

  let amount: number | null = null;
  if (kind === "BILL" && b?.amount != null && b?.amount !== "") {
    amount = posNum(b.amount);
    if (amount == null) return bad("Valor inválido");
  }

  const notes = typeof b?.notes === "string" ? str(b.notes, 300) : null;

  const created = await prisma.task.create({
    data: { title, kind, dueDate, amount: amount ?? undefined, notes: notes ?? undefined },
  });
  return NextResponse.json(created, { status: 201 });
}
