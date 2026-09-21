import { parseTransaction } from "./parser.ts";

const now = new Date(2026, 8, 21, 10, 0, 0);
const cases: [string, Record<string, unknown>][] = [
  ["Gastei 50 reais em almoço hoje", { type: "EXPENSE", amount: 50, category: "Alimentação", description: "Almoço" }],
  ["Gastei 45,90 no mercado", { type: "EXPENSE", amount: 45.9, category: "Alimentação" }],
  ["Gastei 120 em combustível", { type: "EXPENSE", amount: 120, category: "Transporte" }],
  ["Recebi R$ 1.250,50 de salário", { type: "INCOME", amount: 1250.5, category: "Salário" }],
  ["Paguei 800 de aluguel dia 05/09", { type: "EXPENSE", amount: 800, category: "Moradia" }],
  ["Vendi 3.000 para cliente ontem", { type: "INCOME", amount: 3000, category: "Vendas" }],
  ["oi tudo bem", {}],
];

let fail = 0;
for (const [input, expected] of cases) {
  const r = parseTransaction(input, now);
  if (Object.keys(expected).length === 0) {
    if (r !== null) { fail++; console.log("FALHOU (esperava null):", input, r); }
    continue;
  }
  const ok = r && Object.entries(expected).every(([k, v]) => (r as Record<string, unknown>)[k] === v);
  if (!ok) { fail++; console.log("FALHOU:", input, r); }
}
const y = parseTransaction("Gastei 30 no cafe ontem", now)!;
if (y.date.getDate() !== 20) { fail++; console.log("FALHOU data ontem", y.date); }
const d = parseTransaction("Paguei 800 de aluguel dia 05/09", now)!;
if (d.date.getDate() !== 5 || d.date.getMonth() !== 8) { fail++; console.log("FALHOU data dd/mm", d.date); }
console.log(fail === 0 ? "todos os testes passaram" : `${fail} falhas`);
process.exit(fail ? 1 : 0);
