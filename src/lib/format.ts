export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const money = (v: number, currency: string) =>
  v.toLocaleString("pt-BR", { style: "currency", currency });
