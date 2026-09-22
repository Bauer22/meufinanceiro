"use client";
import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { api, errMsg } from "@/lib/client";
import { brl, fmtDate } from "@/lib/format";
import { BalanceLine, CategoryBars, MonthlyBars } from "@/components/Charts";
import { card, ErrorBox, input, PageTitle } from "@/components/ui";

type Report = {
  from: string; to: string;
  totals: { income: number; expense: number; net: number; avgExpense: number };
  monthly: { month: string; income: number; expense: number }[];
  balance: { month: string; value: number }[];
  byCategory: { category: string; total: number }[];
  topExpenses: { description: string; amount: number; category: string; date: string }[];
};

export default function Relatorios() {
  const [months, setMonths] = useState("6");
  const [r, setR] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Report>(`/api/reports?months=${months}`).then((d) => { setR(d); setError(null); }).catch((e) => setError(errMsg(e)));
  }, [months]);

  const empty = r && r.totals.income === 0 && r.totals.expense === 0;

  return (
    <main className="p-4 md:p-8">
      <PageTitle
        icon={<BarChart3 className="text-emerald-500" />}
        right={
          <select value={months} onChange={(e) => setMonths(e.target.value)} aria-label="Período" className={`${input} w-auto`}>
            <option value="3">Últimos 3 meses</option><option value="6">Últimos 6 meses</option>
            <option value="12">Últimos 12 meses</option><option value="24">Últimos 24 meses</option>
          </select>
        }
      >
        Relatórios
      </PageTitle>

      {error && <ErrorBox>{error}</ErrorBox>}
      {empty && <p className="mb-6 text-sm text-slate-400">Ainda não há lançamentos neste período.</p>}

      {r && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className={card}><p className="text-sm text-slate-400">Receitas</p><p className="mt-1 text-xl font-bold text-emerald-400">{brl(r.totals.income)}</p></div>
            <div className={card}><p className="text-sm text-slate-400">Despesas</p><p className="mt-1 text-xl font-bold text-rose-400">{brl(r.totals.expense)}</p></div>
            <div className={card}><p className="text-sm text-slate-400">Resultado</p><p className={`mt-1 text-xl font-bold ${r.totals.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{brl(r.totals.net)}</p></div>
            <div className={card}><p className="text-sm text-slate-400">Gasto médio/mês</p><p className="mt-1 text-xl font-bold">{brl(r.totals.avgExpense)}</p></div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className={card}>
              <h2 className="mb-1 text-lg font-semibold">Receitas x despesas por mês</h2>
              <p className="mb-3 flex gap-4 text-xs text-slate-400">
                <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Receitas</span>
                <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Despesas</span>
              </p>
              <MonthlyBars data={r.monthly} />
            </section>

            <section className={card}>
              <h2 className="mb-3 text-lg font-semibold">Evolução do saldo</h2>
              <BalanceLine data={r.balance} />
              <p className="mt-2 text-xs text-slate-500">Inclui parcelas e lançamentos com data futura.</p>
            </section>

            <section className={card}>
              <h2 className="mb-4 text-lg font-semibold">Despesas por categoria</h2>
              {r.byCategory.length ? <CategoryBars data={r.byCategory} /> : <p className="text-sm text-slate-500">Sem despesas no período.</p>}
            </section>

            <section className={card}>
              <h2 className="mb-4 text-lg font-semibold">Maiores despesas</h2>
              {r.topExpenses.length ? (
                <ul className="divide-y divide-slate-800">
                  {r.topExpenses.map((t, i) => (
                    <li key={i} className="flex justify-between gap-3 py-3 text-sm">
                      <span className="min-w-0"><span className="block truncate">{t.description}</span><span className="text-xs text-slate-500">{t.category} · {fmtDate(t.date)}</span></span>
                      <span className="text-rose-400">{brl(t.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-500">Sem despesas no período.</p>}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
