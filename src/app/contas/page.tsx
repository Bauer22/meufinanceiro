"use client";
import { useCallback, useEffect, useState } from "react";
import { Landmark, CreditCard, Wallet, Trash2, Plus } from "lucide-react";
import { api, errMsg } from "@/lib/client";
import { brl } from "@/lib/format";
import { btn, card, ErrorBox, Field, input, PageTitle } from "@/components/ui";

type Account = { id: string; name: string; type: "CHECKING" | "CASH" | "CARD"; initialBalance: number; balance: number };
const TYPES = { CHECKING: "Conta corrente", CASH: "Dinheiro", CARD: "Cartão" } as const;
const ICON = { CHECKING: Landmark, CASH: Wallet, CARD: CreditCard } as const;

export default function Contas() {
  const [list, setList] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", type: "CHECKING", initialBalance: "" });

  const load = useCallback(async () => {
    try { setList(await api<Account[]>("/api/accounts")); setError(null); } catch (e) { setError(errMsg(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api("/api/accounts", { method: "POST", json: f }); setF({ name: "", type: "CHECKING", initialBalance: "" }); load(); } catch (x) { setError(errMsg(x)); }
  };
  const remove = async (a: Account) => {
    if (!confirm(`Apagar "${a.name}"? Os lançamentos continuam no histórico, sem conta.`)) return;
    try { await api(`/api/accounts/${a.id}`, { method: "DELETE" }); load(); } catch (x) { setError(errMsg(x)); }
  };

  const total = list.reduce((s, a) => s + a.balance, 0);

  return (
    <main className="p-4 md:p-8">
      <PageTitle icon={<Landmark className="text-emerald-500" />}>Contas e cartões</PageTitle>
      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold">Suas contas</h2>
          <ul className="divide-y divide-slate-800">
            {list.map((a) => {
              const Icon = ICON[a.type];
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex items-center gap-3"><Icon className="h-5 w-5 text-slate-400" /><span><span className="block text-sm">{a.name}</span><span className="text-xs text-slate-500">{TYPES[a.type]}</span></span></span>
                  <span className="flex items-center gap-3">
                    <span className={a.balance >= 0 ? "text-emerald-400" : "text-rose-400"}>{brl(a.balance)}</span>
                    <button onClick={() => remove(a)} aria-label={`Apagar ${a.name}`} className="text-slate-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                  </span>
                </li>
              );
            })}
            {list.length === 0 && <li className="py-3 text-sm text-slate-500">Nenhuma conta cadastrada.</li>}
          </ul>
          {list.length > 0 && <p className="mt-3 text-right text-sm text-slate-400">Total nas contas: <strong className="text-slate-100">{brl(total)}</strong></p>}
          <p className="mt-3 text-xs text-slate-500">O saldo considera o saldo inicial mais os lançamentos vinculados à conta até hoje. Em cartões, compras parceladas aparecem mês a mês.</p>
        </section>

        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold">Nova conta</h2>
          <form onSubmit={add} className="grid grid-cols-2 gap-3">
            <Field label="Nome" className="col-span-2"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex: Nubank, Carteira" className={input} /></Field>
            <Field label="Tipo">
              <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={input}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Saldo inicial (R$)"><input inputMode="decimal" value={f.initialBalance} onChange={(e) => setF({ ...f, initialBalance: e.target.value })} placeholder="0,00" className={input} /></Field>
            <button className={`${btn} col-span-2`} disabled={!f.name}><Plus className="h-4 w-4" /> Adicionar</button>
          </form>
        </section>
      </div>
    </main>
  );
}
