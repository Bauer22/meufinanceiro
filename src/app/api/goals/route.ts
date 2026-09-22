import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseISODate } from "@/lib/dates";
import { bad, num, posNum, str } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await prisma.goal.findMany({ orderBy: { createdAt: "asc" } }));
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const name = str(b?.name, 80);
  const target = posNum(b?.target);
  if (!name || !target) return bad("Dados inválidos");
  const saved = b?.saved !== undefined && b?.saved !== "" ? num(b.saved) : 0;
  if (saved === null || saved < 0) return bad("Valor guardado inválido");
  const deadline = b?.deadline ? parseISODate(b.deadline) : null;
  if (b?.deadline && !deadline) return bad("Prazo inválido");
  return NextResponse.json(await prisma.goal.create({ data: { name, target, saved, deadline } }), { status: 201 });
}
