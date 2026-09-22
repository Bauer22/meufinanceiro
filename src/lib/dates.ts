// Datas dos lançamentos são guardadas ao meio-dia UTC do dia escolhido.
// Assim o dia não "escorrega" entre fusos (Vercel roda em UTC; o usuário está no Brasil).

export const TZ = "America/Sao_Paulo";

/** Ano, mês (1-12) e dia de "hoje" no fuso de São Paulo. */
export function todayParts(now: Date = new Date()): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value, 10);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** m é 1-12. */
export const utcNoon = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 12));
export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export const monthKey = (d: Date) => d.toISOString().slice(0, 7);
export const ymd = (d: Date) => d.toISOString().slice(0, 10);
export const keyOf = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

export function addMonths(y: number, m: number, n: number): { y: number; m: number } {
  const t = y * 12 + (m - 1) + n;
  return { y: Math.floor(t / 12), m: (t % 12) + 1 };
}

/** "YYYY-MM" -> [início, fim) em UTC. */
export function monthBounds(key: string): { start: Date; end: Date } | null {
  const mm = /^(\d{4})-(\d{2})$/.exec(key);
  if (!mm) return null;
  const y = +mm[1];
  const m = +mm[2];
  if (m < 1 || m > 12) return null;
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}

/** "YYYY-MM-DD" -> Date ao meio-dia UTC, ou null. */
export function parseISODate(s: unknown): Date | null {
  if (typeof s !== "string") return null;
  const mm = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!mm) return null;
  const y = +mm[1], m = +mm[2], d = +mm[3];
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return utcNoon(y, m, d);
}

/** Divide o total em n parcelas em centavos; a última absorve a diferença. */
export function splitInstallments(total: number, n: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const out = Array<number>(n).fill(base);
  out[n - 1] = cents - base * (n - 1);
  return out.map((c) => c / 100);
}

/** Datas mensais a partir de start, mantendo o dia (ajustado ao fim de meses curtos). */
export function installmentDates(start: Date, n: number): Date[] {
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth() + 1;
  const d = start.getUTCDate();
  return Array.from({ length: n }, (_, i) => {
    const t = addMonths(y, m, i);
    return utcNoon(t.y, t.m, Math.min(d, daysInMonth(t.y, t.m)));
  });
}
