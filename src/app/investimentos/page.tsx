"use client";
import { useCallback, useEffect, useState } from "react";
import { TrendingUp, Trash2, Plus } from "lucide-react";
import { api, errMsg } from "@/lib/client";
import { brl, money, pct } from "@/lib/format";
import { btn, card, ErrorBox, Field, input, PageTitle } from "@/components/ui";

type Inv = {
  id: string; name: string; amount: number; currency: "BRL" | "USD" | "EUR"; rateAtEntry: number | null;
  currentBRL: number; costBRL: number | null; gainBRL: number | null; gainPct: number | null;
};

export default function Investimentos() {
  const [items, setItems] = useState<Inv[]>([]);
  const [ratesOk, setRatesOk] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", amount: "", currency: "BRL", rate: "" });

  const load = useCallback(async () => {
    try {
      const d = await api<{ items: Inv[]; ratesOk: boolean }>("/api/investments");
      setItems(d.items); setRatesOk(d.ratesOk); setError(null);
    } catch (e) { setError(errMsg(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api("/api/investments", { method: "POST", json: f }); setF({ name: "", amount: "", currency: "BRL", rate: "" }); load(); } catch (x) { setError(errMsg(x)); }
  };
  const remove = async (i: Inv) => {
    if (!confirm(`Apagar "${i.name}"?`)) return;
    try { await api(`/api/investments/${i.id}`, { method: "DELETE" }); load(); } catch (x) { setError(errMsg(x)); }
  };

  const total = items.reduce((s, i) => s + i.currentBRL, 0);
  const known = items.filter((i) => i.costBRL != null);
  const gain = known.reduce((s, i) => s + (i.gainBRL ?? 0), 0);
  const cost = known.reduce((s, i) => s + (i.costBRL ?? 0), 0);

  return (
    <main className="p-4 md:p-8">
      <PageTitle icon={<TrendingUp className="text-emerald-500" />}>Investimentos</PageTitle>
      {error && <ErrorBox>{error}</ErrorBox>}
      {!ratesOk && <ErrorBox>Cotações indisponíveis agora: investimentos em USD/EUR estão valorizados pela cotação do aporte.</ErrorBox>}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={card}><p className="text-sm text-slate-400">Valor atual (R$)</p><p className="mt-1 text-2xl font-bold text-blue-400">{brl(total)}</p></div>
        <div className={card}><p className="text-sm text-slate-400">Ganho / perda desde o aporte</p>
          <p className={`mt-1 text-2xl font-bold ${gain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{known.length ? brl(gain) : "—"}</p></div>
        <div className={card}><p className="text-sm text-slate-400">Rentabilidade</p>
          <p className={`mt-1 text-2xl font-bold ${gain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{cost ? pct((gain / cost) * 100) : "—"}</p></div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`}>
          <h2 className="mb-4 text-lg font-semibold">Carteira</h2>
          <ul className="divide-y divide-slate-800">
            {items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{i.name}</p>
                  <p className="text-xs text-slate-500">
                    Aportado: {money(i.amount, i.currency)}
                    {i.currency !== "BRL" && i.rateAtEntry ? ` (cotação ${brl(i.rateAtEntry)})` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-right">
                  <div>
                    <p className="text-sm">{brl(i.currentBRL)}</p>
                    <p className={`text-xs ${i.gainBRL == null ? "text-slate-500" : i.gainBRL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {i.gainBRL == null ? "sem cotação do aporte" : `${i.gainBRL >= 0 ? "+" : "−"} ${brl(Math.abs(i.gainBRL))}${i.gainPct != null ? ` (${pct(i.gainPct)})` : ""}`}
                    </p>
                  </div>
                  <button onClick={() => remove(i)} aria-label={`Apagar ${i.name}`} className="text-slate-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
            {items.length === 0 && <li className="py-3 text-sm text-slate-500">Nenhum investimento cadastrado.</li>}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Em BRL não há variação cambial: o ganho de renda fixa ou ações deve ser atualizado editando o valor. Para USD/EUR, o ganho mostrado é a variação do câmbio.</p>
        </section>

        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold">Novo aporte</h2>
          <form onSubmit={add} className="space-y-3">
            <Field label="Nome"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex: Tesouro Direto" className={input} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor"><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={input} /></Field>
              <Field label="Moeda"><select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} className={input}><option>BRL</option><option>USD</option><option>EUR</option></select></Field>
            </div>
            {f.currency !== "BRL" && (
              <Field label="Cotação do aporte em R$ (vazio = cotação de hoje)"><input inputMode="decimal" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} placeholder="Ex: 5,20" className={input} /></Field>
            )}
            <button className={`${btn} w-full`} disabled={!f.name || !f.amount}><Plus className="h-4 w-4" /> Adicionar</button>
          </form>
        </section>
      </div>
    </main>
  );
}
