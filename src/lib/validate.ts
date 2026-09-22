export const num = (v: unknown): number | null => {
  // "1.250,50" (pt-BR) e "1250.5" são aceitos.
  const n = typeof v === "string" ? parseFloat(v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v) : Number(v);
  return Number.isFinite(n) ? n : null;
};

export const posNum = (v: unknown): number | null => {
  const n = num(v);
  return n !== null && n > 0 && n < 1e12 ? n : null;
};

export const str = (v: unknown, max = 120): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length > 0 && s.length <= max ? s : null;
};

export const oneOf = <T extends string>(v: unknown, opts: readonly T[]): T | null =>
  typeof v === "string" && (opts as readonly string[]).includes(v) ? (v as T) : null;

export const bad = (msg: string, status = 400) => Response.json({ error: msg }, { status });
