import { prisma } from "@/lib/prisma";
import { buildWhere } from "@/lib/filters";
import { ymd } from "@/lib/dates";

export const dynamic = "force-dynamic";

// CSV em UTF-8 com BOM e separador ";" (abre direto no Excel em português).
// Células que começam com = + - @ recebem apóstrofo para evitar injeção de fórmulas.
const cell = (v: string | number | null | undefined) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const money = (n: number) => n.toFixed(2).replace(".", ",");

export async function GET(req: Request) {
  const where = buildWhere(new URL(req.url).searchParams);
  const rows = await prisma.transaction.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 20000,
    include: { account: { select: { name: true } } },
  });

  const header = ["Data", "Descrição", "Tipo", "Categoria", "Conta", "Valor", "Parcela"];
  const lines = rows.map((r) =>
    [
      ymd(r.date),
      r.description,
      r.type === "INCOME" ? "Receita" : "Despesa",
      r.category,
      r.account?.name ?? "",
      money(r.type === "INCOME" ? r.amount : -r.amount),
      r.installmentNumber ? `${r.installmentNumber}/${r.installmentTotal}` : "",
    ].map(cell).join(";"),
  );

  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n") + "\r\n";
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="lancamentos-${ymd(new Date())}.csv"`,
    },
  });
}
