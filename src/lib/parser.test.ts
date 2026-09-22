import { parseTransaction } from "./parser";
import { splitInstallments, installmentDates, utcNoon, todayParts } from "./dates";

// 21/09/2026 12:00 em São Paulo
const now = new Date(Date.UTC(2026, 8, 21, 15, 0, 0));
let fail = 0;
const check = (name: string, ok: boolean, extra?: unknown) => {
  if (!ok) { fail++; console.log("FALHOU:", name, extra ?? ""); }
};

const cases: [string, Record<string, unknown>][] = [
  ["Gastei 50 reais em almoço hoje", { type: "EXPENSE", amount: 50, category: "Alimentação", description: "Almoço" }],
  ["Gastei 45,90 no mercado", { type: "EXPENSE", amount: 45.9, category: "Alimentação" }],
  ["Gastei 120 em combustível", { type: "EXPENSE", amount: 120, category: "Transporte" }],
  ["Recebi R$ 1.250,50 de salário", { type: "INCOME", amount: 1250.5, category: "Salário" }],
  ["Paguei 800 de aluguel dia 05/09", { type: "EXPENSE", amount: 800, category: "Moradia" }],
  ["Vendi 3.000 para cliente ontem", { type: "INCOME", amount: 3000, category: "Vendas" }],
  ["Comprei tênis 300 em 3x", { type: "EXPENSE", amount: 300, installments: 3 }],
  ["Comprei em 6x uma geladeira 2.400", { type: "EXPENSE", amount: 2400, installments: 6 }],
  ["Gastei 200 em 12 parcelas no curso", { amount: 200, installments: 12, category: "Educação" }],
  ["oi tudo bem", {}],
];
for (const [input, expected] of cases) {
  const r = parseTransaction(input, now);
  if (Object.keys(expected).length === 0) { check(`null: ${input}`, r === null, r); continue; }
  const ok = r && Object.entries(expected).every(([k, v]) => (r as unknown as Record<string, unknown>)[k] === v);
  check(input, !!ok, r);
}

// datas ao meio-dia UTC
const ontem = parseTransaction("Gastei 30 no cafe ontem", now)!;
check("ontem", ontem.date.toISOString() === "2026-09-20T12:00:00.000Z", ontem.date);
const dm = parseTransaction("Paguei 800 de aluguel dia 05/09", now)!;
check("dd/mm", dm.date.toISOString() === "2026-09-05T12:00:00.000Z", dm.date);
const hoje = parseTransaction("Gastei 10 no lanche", now)!;
check("hoje", hoje.date.toISOString() === "2026-09-21T12:00:00.000Z", hoje.date);

// 22h em São Paulo já é dia seguinte em UTC: "hoje" continua sendo o dia de São Paulo
const late = new Date(Date.UTC(2026, 8, 22, 1, 30, 0));
check("hoje à noite", parseTransaction("Gastei 10 no lanche", late)!.date.toISOString() === "2026-09-21T12:00:00.000Z");
check("todayParts", JSON.stringify(todayParts(late)) === JSON.stringify({ y: 2026, m: 9, d: 21 }));

// parcelas
const parts = splitInstallments(100, 3);
check("split soma", Math.round(parts.reduce((a, b) => a + b, 0) * 100) === 10000, parts);
check("split valores", parts.join() === "33.33,33.33,33.34", parts);
const ds = installmentDates(utcNoon(2026, 1, 31), 3).map((d) => d.toISOString().slice(0, 10));
check("datas parcelas fim de mês", ds.join() === "2026-01-31,2026-02-28,2026-03-31", ds);
const cross = installmentDates(utcNoon(2026, 11, 15), 3).map((d) => d.toISOString().slice(0, 10));
check("virada de ano", cross.join() === "2026-11-15,2026-12-15,2027-01-15", cross);

console.log(fail === 0 ? "todos os testes passaram" : `${fail} falhas`);
process.exit(fail ? 1 : 0);
