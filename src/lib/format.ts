export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const money = (v: number, currency: string) => v.toLocaleString("pt-BR", { style: "currency", currency });

/** Datas dos lançamentos são meio-dia UTC: exibir em UTC evita mudar de dia. */
export const fmtDate = (iso: string | Date) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]}/${y.slice(2)}`;
};
