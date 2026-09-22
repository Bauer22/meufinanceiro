import type { Prisma } from "@prisma/client";
import { monthBounds, parseISODate } from "./dates";

/** Filtros compartilhados pela listagem e pela exportação. */
export function buildWhere(sp: URLSearchParams): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {};
  const date: { gte?: Date; lt?: Date; lte?: Date } = {};

  const month = sp.get("month");
  if (month) {
    const b = monthBounds(month);
    if (b) { date.gte = b.start; date.lt = b.end; }
  }
  const from = parseISODate(sp.get("from"));
  const to = parseISODate(sp.get("to"));
  if (from) date.gte = from;
  if (to) { delete date.lt; date.lte = to; }
  if (date.gte || date.lt || date.lte) where.date = date;

  const type = sp.get("type");
  if (type === "INCOME" || type === "EXPENSE") where.type = type;

  const category = sp.get("category");
  if (category) where.category = category;

  const account = sp.get("accountId");
  if (account === "none") where.accountId = null;
  else if (account) where.accountId = account;

  const q = sp.get("q")?.trim();
  if (q) where.description = { contains: q.slice(0, 80), mode: "insensitive" };

  return where;
}
