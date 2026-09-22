"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, AlertTriangle, CalendarClock, Check } from "lucide-react";
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
type TaskItem = { id: string; title: string; kind: "TASK" | "BILL"; amount: number | null; dueDate: string; done: boolean };
type RecItem = { id: string; description: string; amount: number; type: "INCOME" | "EXPENSE"; account: { name: string } | null };
type Today = { dueToday: TaskItem[]; overdue: TaskItem[]; recurringToday: RecItem[] };

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [rates, setRates] = useState<Rates>({ USD: null, EUR: null });
  const [today, setToday] = useState<Today | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      await api("/api/recurring/run", { method: "POST" }).catch(() => null); // gera recorrentes vencidos
      const [s, t, r, hoje] = await Promise.all([
        api<Summary>("/api/summary"),
        api<{ items: Tx[] }>("/api/transactions?limit=8"),
        api<Rates>("/api/rates"),
        api<Today>("/api/today"),
      ]);
      setSummary(s);
      setTxs(t.items);
      setRates(r);
      setToday(hoje);
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

  const doneToday = async (id: string) => {
    try {
      await api(`/api/tasks/${id}`, { method: "PATCH", json: { done: true } });
      load();
    } catch (x) {
      setError(errMsg(x));
    }
  };

  const billsToday = today?.recurringToday ?? [];
  const billsTotal = billsToday.reduce((acc, b) => acc + (b.type === "EXPENSE" ? b.amount : -b.amount), 0);
  const hasDaily = !!today && (today.dueToday.length > 0 || today.overdue.length > 0 || billsToday.length > 0);

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

      {hasDaily && (
        <div role="status" className="mb-6 rounded-xl border border-sky-800 bg-sky-950/30 p-4 text-sm text-sky-200">
          <p className="mb-2 flex items-center gap-2 font-medium">
            <CalendarClock className="h-4 w-4" /> Hoje — saldo atual {brl(s?.balance ?? 0)}
          </p>
          <ul className="space-y-1.5">
            {today!.overdue.length > 0 && (
              <li className="text-amber-300">
                {today!.overdue.length} afazer(es)/conta(s) atrasado(s). <Link href="/calendario" className="underline">Ver no calendário</Link>
              </li>
            )}
            {today!.dueToday.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3">
                <span>
                  {t.kind === "BILL" ? "Conta: " : "Afazer: "}
                  {t.title}
                  {t.amount != null && <> — {brl(t.amount)}</>}
                </span>
                <button onClick={() => doneToday(t.id)} className="flex shrink-0 items-center gap-1 text-emerald-300 hover:text-emerald-200">
                  <Check className="h-3.5 w-3.5" /> Feito
                </button>
              </li>
            ))}
            {billsToday.map((b) => (
              <li key={b.id}>
                Conta recorrente: {b.description}
                {b.account ? ` (${b.account.name})` : ""} — {brl(b.amount)}
              </li>
            ))}
            {billsToday.length > 0 && (
              <li className="pt-1 text-xs text-sky-300/80">
                Impacto de hoje nas recorrentes: {billsTotal >= 0 ? "−" : "+"} {brl(Math.abs(billsTotal))}
              </li>
            )}
          </ul>
          <Link href="/calendario" className="mt-2 inline-block text-sky-300 underline">Ver calendário completo</Link>
        </div>
      )}

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
