"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";
import { api, errMsg } from "@/lib/client";
import { brl, fmtDate, money } from "@/lib/format";
import { card, ErrorBox, PageTitle } from "@/components/ui";

type Summary = {
  balance: number; income: number; expense: number; investments: number;
  investmentsGain: number | null; ratesOk: boolean;
  alerts: { category: string; limit: number; spent: number }[];
};
type Tx = { id: string; description: string; amount: number; type: "INCOME" | "EXPENSE"; category: string; date: string };
type Rates = { USD: number | null; EUR: number | null };

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [rates, setRates] = useState<Rates>({ USD: null, EUR: null });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      await api("/api/recurring/run", { method: "POST" }).catch(() => null); // gera recorrentes vencidos
      const [s, t, r] = await Promise.all([
        api<Summary>("/api/summary"),
        api<{ items: Tx[] }>("/api/transactions?limit=8"),
        api<Rates>("/api/rates"),
      ]);
      setSummary(s);
      setTxs(t.items);
      setRates(r);
      setError(null);
    } catch (e) {
      setError(`Não foi possível carregar os dados: ${errMsg(e)}`);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const conv = (v: number, c: "USD" | "EUR") => (rates[c] ? money(v / rates[c]!, c) : "—");
  const s = summary;

  return (
    <main className="p-4 md:p-8">
      <PageTitle
        icon={<Wallet className="text-emerald-500" />}
        right={
          <div className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
            <span>USD: {rates.USD ? brl(rates.USD) : "…"}</span>
            <span>EUR: {rates.EUR ? brl(rates.EUR) : "…"}</span>
          </div>
        }
      >
        Finanças &amp; Investimentos
      </PageTitle>

      {error && <ErrorBox>{error}</ErrorBox>}

      {s && s.alerts.length > 0 && (
        <div role="status" className="mb-6 rounded-xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200">
          <p className="mb-2 flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" /> Atenção aos orçamentos do mês</p>
          <ul className="space-y-1">
            {s.alerts.map((a) => (
              <li key={a.category}>
                {a.category}: {brl(a.spent)} de {brl(a.limit)} ({Math.round((a.spent / a.limit) * 100)}%)
                {a.spent > a.limit && <strong className="text-rose-300"> — limite estourado</strong>}
              </li>
            ))}
          </ul>
          <Link href="/metas" className="mt-2 inline-block text-amber-300 underline">Ver orçamentos</Link>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className={card}>
          <p className="text-sm text-slate-400">Saldo total</p>
          <h3 className="mt-1 text-2xl font-bold">{brl(s?.balance ?? 0)}</h3>
          <div className="mt-2 flex gap-2 text-xs text-slate-500">
            <span>{conv(s?.balance ?? 0, "USD")}</span>|<span>{conv(s?.balance ?? 0, "EUR")}</span>
          </div>
        </div>
        <div className={card}>
          <p className="flex items-center gap-1 text-sm text-slate-400"><ArrowUpRight className="h-4 w-4 text-emerald-500" /> Receitas do mês</p>
          <h3 className="mt-1 text-2xl font-bold text-emerald-400">{brl(s?.income ?? 0)}</h3>
        </div>
        <div className={card}>
          <p className="flex items-center gap-1 text-sm text-slate-400"><ArrowDownRight className="h-4 w-4 text-rose-500" /> Gastos do mês</p>
          <h3 className="mt-1 text-2xl font-bold text-rose-400">{brl(s?.expense ?? 0)}</h3>
        </div>
        <div className={card}>
          <p className="flex items-center gap-1 text-sm text-slate-400"><TrendingUp className="h-4 w-4 text-blue-500" /> Investimentos (valor atual)</p>
          <h3 className="mt-1 text-2xl font-bold text-blue-400">{brl(s?.investments ?? 0)}</h3>
          {s?.investmentsGain != null && (
            <p className={`mt-2 text-xs ${s.investmentsGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {s.investmentsGain >= 0 ? "Ganho" : "Perda"} de {brl(Math.abs(s.investmentsGain))} desde o aporte
            </p>
          )}
          {s && !s.ratesOk && <p className="mt-2 text-xs text-slate-500">Sem cotação no momento.</p>}
        </div>
      </div>

      <section className={card}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimos lançamentos</h2>
          <Link href="/lancamentos" className="text-sm text-emerald-400 hover:underline">Ver todos</Link>
        </div>
        {txs.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum lançamento ainda. Use a aba Lançar.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm">{t.description}</p>
                  <p className="text-xs text-slate-500">{t.category} · {fmtDate(t.date)}</p>
                </div>
                <span className={t.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}>
                  {t.type === "INCOME" ? "+" : "−"} {brl(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
