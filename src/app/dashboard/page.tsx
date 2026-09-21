"use client";
import { useCallback, useEffect, useState } from "react";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Trash2, Plus } from "lucide-react";
import { brl, money } from "@/lib/format";

type Tx = { id: string; description: string; amount: number; type: "INCOME" | "EXPENSE"; category: string; date: string };
type Inv = { id: string; name: string; amount: number; currency: string };
type Summary = { balance: number; income: number; expense: number; investments: number };

export default function Dashboard() {
  const [rates, setRates] = useState<{ USD: number; EUR: number } | null>(null);
  const [summary, setSummary] = useState<Summary>({ balance: 0, income: 0, expense: 0, investments: 0 });
  const [txs, setTxs] = useState<Tx[]>([]);
  const [invs, setInvs] = useState<Inv[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", amount: "", currency: "BRL" });

  // Cotações em tempo real (AwesomeAPI)
  useEffect(() => {
    fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL")
      .then((r) => r.json())
      .then((d) => setRates({ USD: parseFloat(d.USDBRL.bid), EUR: parseFloat(d.EURBRL.bid) }))
      .catch(() => setRates(null));
  }, []);

  const load = useCallback(async () => {
    try {
      const q = rates ? `?usd=${rates.USD}&eur=${rates.EUR}` : "";
      const [s, t, i] = await Promise.all([
        fetch(`/api/summary${q}`).then((r) => r.json()),
        fetch("/api/transactions?limit=10").then((r) => r.json()),
        fetch("/api/investments").then((r) => r.json()),
      ]);
      if (s.error || !Array.isArray(t) || !Array.isArray(i)) throw new Error();
      setSummary(s);
      setTxs(t);
      setInvs(i);
      setError(null);
    } catch {
      setError("Não foi possível carregar os dados. Verifique a DATABASE_URL e rode `npx prisma db push`.");
    }
  }, [rates]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  const addInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount.replace(/\./g, "").replace(",", "."));
    if (!form.name.trim() || !(amount > 0)) return;
    await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), amount, currency: form.currency }),
    });
    setForm({ name: "", amount: "", currency: "BRL" });
    load();
  };

  const conv = (v: number, c: "USD" | "EUR") => (rates ? money(v / rates[c], c) : "—");

  return (
    <main className="p-4 md:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Wallet className="text-emerald-500" /> Finanças &amp; Investimentos
        </h1>
        <div className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
          <span>USD: {rates ? brl(rates.USD) : "…"}</span>
          <span>EUR: {rates ? brl(rates.EUR) : "…"}</span>
        </div>
      </header>

      {error && <p className="mb-6 rounded-xl border border-rose-900 bg-rose-950/40 p-4 text-sm text-rose-300">{error}</p>}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Saldo total</p>
          <h3 className="mt-1 text-2xl font-bold">{brl(summary.balance)}</h3>
          <div className="mt-2 flex gap-2 text-xs text-slate-500">
            <span>{conv(summary.balance, "USD")}</span>|<span>{conv(summary.balance, "EUR")}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="flex items-center gap-1 text-sm text-slate-400">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" /> Receitas do mês
          </p>
          <h3 className="mt-1 text-2xl font-bold text-emerald-400">{brl(summary.income)}</h3>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="flex items-center gap-1 text-sm text-slate-400">
            <ArrowDownRight className="h-4 w-4 text-rose-500" /> Gastos do mês
          </p>
          <h3 className="mt-1 text-2xl font-bold text-rose-400">{brl(summary.expense)}</h3>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="flex items-center gap-1 text-sm text-slate-400">
            <TrendingUp className="h-4 w-4 text-blue-500" /> Total em investimentos
          </p>
          <h3 className="mt-1 text-2xl font-bold text-blue-400">{brl(summary.investments)}</h3>
          {!rates && <p className="mt-2 text-xs text-slate-500">Sem cotação: USD/EUR contados como R$ 1.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-lg font-semibold">Últimos lançamentos</h2>
          {txs.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum lançamento ainda. Use a aba Lançar.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {txs.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm">{t.description}</p>
                    <p className="text-xs text-slate-500">
                      {t.category} · {new Date(t.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={t.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}>
                      {t.type === "INCOME" ? "+" : "−"} {brl(t.amount)}
                    </span>
                    <button onClick={() => remove(t.id)} aria-label="Excluir lançamento" className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-lg font-semibold">Investimentos</h2>
          <ul className="mb-4 divide-y divide-slate-800">
            {invs.map((i) => (
              <li key={i.id} className="flex justify-between py-3 text-sm">
                <span>{i.name}</span>
                <span>{money(i.amount, i.currency)}</span>
              </li>
            ))}
            {invs.length === 0 && <li className="py-3 text-sm text-slate-500">Nenhum investimento cadastrado.</li>}
          </ul>
          <form onSubmit={addInvestment} className="flex flex-wrap gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome (ex: Tesouro Direto)"
              aria-label="Nome do investimento"
              className="min-w-40 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <input
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Valor"
              inputMode="decimal"
              aria-label="Valor investido"
              className="w-28 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              aria-label="Moeda"
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
            >
              <option>BRL</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
            <button type="submit" aria-label="Adicionar investimento" className="rounded-xl bg-emerald-600 px-4 hover:bg-emerald-500">
              <Plus className="h-5 w-5" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
