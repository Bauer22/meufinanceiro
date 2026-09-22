"use client";
import { useCallback, useEffect, useState } from "react";
import { Repeat, Trash2, Plus } from "lucide-react";
import { api, errMsg } from "@/lib/client";
import { brl } from "@/lib/format";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { btn, btnGhost, card, ErrorBox, Field, input, PageTitle } from "@/components/ui";

type Rec = {
  id: string; description: string; amount: number; type: "INCOME" | "EXPENSE"; category: string;
  dayOfMonth: number; active: boolean; account: { name: string } | null;
};
type Account = { id: string; name: string };
const thisMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 7);

export default function Recorrentes() {
  const [list, setList] = useState<Rec[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [f, setF] = useState({ description: "", amount: "", type: "EXPENSE", category: "Moradia", dayOfMonth: "5", accountId: "", startMonth: thisMonth() });

  const load = useCallback(async () => {
    try {
      const r = await api<{ created: number }>("/api/recurring/run", { method: "POST" });
      if (r.created > 0) setInfo(`${r.created} lançamento(s) gerado(s) automaticamente.`);
      setList(await api<Rec[]>("/api/recurring"));
      setError(null);
    } catch (e) { setError(errMsg(e)); }
  }, []);
  useEffect(() => { load(); api<Account[]>("/api/accounts").then(setAccounts).catch(() => null); }, [load]);

  const cats = f.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api("/api/recurring", { method: "POST", json: f }); setF({ ...f, description: "", amount: "" }); load(); } catch (x) { setError(errMsg(x)); }
  };
  const toggle = async (r: Rec) => { try { await api(`/api/recurring/${r.id}`, { method: "PATCH", json: { active: !r.active } }); load(); } catch (x) { setError(errMsg(x)); } };
  const remove = async (r: Rec) => {
    if (!confirm(`Apagar "${r.description}"? Os lançamentos já gerados permanecem no histórico.`)) return;
    try { await api(`/api/recurring/${r.id}`, { method: "DELETE" }); load(); } catch (x) { setError(errMsg(x)); }
  };

  return (
    <main className="p-4 md:p-8">
      <PageTitle icon={<Repeat className="text-emerald-500" />}>Lançamentos recorrentes</PageTitle>
      {error && <ErrorBox>{error}</ErrorBox>}
      {info && <p role="status" className="mb-6 rounded-xl border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-300">{info}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold">Ativos e pausados</h2>
          <ul className="divide-y divide-slate-800">
            {list.map((r) => (
              <li key={r.id} className={`flex items-center justify-between gap-3 py-3 ${r.active ? "" : "opacity-50"}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm">{r.description}</p>
                  <p className="text-xs text-slate-500">Todo dia {r.dayOfMonth} · {r.category}{r.account ? ` · ${r.account.name}` : ""}{r.active ? "" : " · pausado"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={r.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}>{r.type === "INCOME" ? "+" : "−"} {brl(r.amount)}</span>
                  <button onClick={() => toggle(r)} className={btnGhost}>{r.active ? "Pausar" : "Retomar"}</button>
                  <button onClick={() => remove(r)} aria-label={`Apagar ${r.description}`} className="text-slate-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
            {list.length === 0 && <li className="py-3 text-sm text-slate-500">Nenhum lançamento recorrente. Cadastre aluguel, assinaturas, salário…</li>}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Os lançamentos são criados sozinhos quando o dia do mês chega, ao abrir o app. Meses curtos usam o último dia.</p>
        </section>

        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold">Novo recorrente</h2>
          <form onSubmit={add} className="grid grid-cols-2 gap-3">
            <Field label="Descrição" className="col-span-2"><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ex: Aluguel" className={input} /></Field>
            <Field label="Valor (R$)"><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={input} /></Field>
            <Field label="Dia do mês"><input type="number" min={1} max={31} value={f.dayOfMonth} onChange={(e) => setF({ ...f, dayOfMonth: e.target.value })} className={input} /></Field>
            <Field label="Tipo">
              <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value, category: "Outros" })} className={input}>
                <option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option>
              </select>
            </Field>
            <Field label="Categoria"><select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={input}>{cats.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Conta / cartão">
              <select value={f.accountId} onChange={(e) => setF({ ...f, accountId: e.target.value })} className={input}>
                <option value="">Sem conta</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Começa em"><input type="month" value={f.startMonth} onChange={(e) => setF({ ...f, startMonth: e.target.value })} className={input} /></Field>
            <button className={`${btn} col-span-2`} disabled={!f.description || !f.amount}><Plus className="h-4 w-4" /> Adicionar</button>
          </form>
        </section>
      </div>
    </main>
  );
}
