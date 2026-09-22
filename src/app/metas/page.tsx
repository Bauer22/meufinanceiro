"use client";
import { useCallback, useEffect, useState } from "react";
import { Target, Trash2, Plus } from "lucide-react";
import { api, errMsg } from "@/lib/client";
import { brl, fmtDate, pct } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { btn, btnGhost, card, ErrorBox, Field, input, PageTitle, Progress } from "@/components/ui";

type Budgets = {
  month: string;
  items: { id: string; category: string; limit: number; spent: number }[];
  unbudgeted: { category: string; spent: number }[];
};
type Goal = { id: string; name: string; target: number; saved: number; deadline: string | null };

const thisMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 7);

export default function Metas() {
  const [month, setMonth] = useState(thisMonth());
  const [budgets, setBudgets] = useState<Budgets | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bf, setBf] = useState({ category: EXPENSE_CATEGORIES[0], limit: "" });
  const [gf, setGf] = useState({ name: "", target: "", deadline: "" });
  const [deposit, setDeposit] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [b, g] = await Promise.all([api<Budgets>(`/api/budgets?month=${month}`), api<Goal[]>("/api/goals")]);
      setBudgets(b); setGoals(g); setError(null);
    } catch (e) { setError(errMsg(e)); }
  }, [month]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => { try { await fn(); await load(); } catch (e) { setError(errMsg(e)); } };

  return (
    <main className="p-4 md:p-8">
      <PageTitle icon={<Target className="text-emerald-500" />}>Orçamento e metas</PageTitle>
      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={card}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Orçamento mensal</h2>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Mês" className={`${input} w-auto`} />
          </div>

          <ul className="mb-5 space-y-4">
            {budgets?.items.map((b) => {
              const ratio = b.spent / b.limit;
              return (
                <li key={b.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{b.category}</span>
                    <span className="flex items-center gap-2">
                      <span className={ratio >= 1 ? "text-rose-400" : ratio >= 0.8 ? "text-amber-400" : "text-slate-300"}>
                        {brl(b.spent)} / {brl(b.limit)} ({pct(ratio * 100)})
                      </span>
                      <button onClick={() => confirm(`Remover o limite de ${b.category}?`) && run(() => api(`/api/budgets/${b.id}`, { method: "DELETE" }))} aria-label={`Remover limite de ${b.category}`} className="text-slate-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                    </span>
                  </div>
                  <Progress value={b.spent} max={b.limit} />
                  {ratio >= 1 && <p className="mt-1 text-xs text-rose-400">Limite estourado em {brl(b.spent - b.limit)}.</p>}
                </li>
              );
            })}
            {budgets && budgets.items.length === 0 && <li className="text-sm text-slate-500">Nenhum limite definido ainda.</li>}
          </ul>

          <form
            onSubmit={(e) => { e.preventDefault(); run(async () => { await api("/api/budgets", { method: "PUT", json: bf }); setBf({ ...bf, limit: "" }); }); }}
            className="flex flex-wrap items-end gap-2"
          >
            <Field label="Categoria" className="min-w-36 flex-1">
              <select value={bf.category} onChange={(e) => setBf({ ...bf, category: e.target.value })} className={input}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Limite (R$)" className="w-32"><input inputMode="decimal" value={bf.limit} onChange={(e) => setBf({ ...bf, limit: e.target.value })} className={input} /></Field>
            <button className={btn} disabled={!bf.limit}>Salvar limite</button>
          </form>

          {budgets && budgets.unbudgeted.length > 0 && (
            <div className="mt-5 border-t border-slate-800 pt-4">
              <p className="mb-2 text-xs text-slate-400">Gastos em categorias sem limite neste mês</p>
              <ul className="space-y-1 text-sm text-slate-400">
                {budgets.unbudgeted.map((u) => <li key={u.category} className="flex justify-between"><span>{u.category}</span><span>{brl(u.spent)}</span></li>)}
              </ul>
            </div>
          )}
        </section>

        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold">Metas de economia</h2>
          <ul className="mb-5 space-y-5">
            {goals.map((g) => {
              const done = g.saved >= g.target;
              return (
                <li key={g.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{g.name}{done && <span className="ml-2 text-xs text-emerald-400">meta atingida</span>}</span>
                    <button onClick={() => confirm(`Apagar a meta "${g.name}"?`) && run(() => api(`/api/goals/${g.id}`, { method: "DELETE" }))} aria-label={`Apagar meta ${g.name}`} className="text-slate-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <Progress value={g.saved} max={g.target} tone="goal" />
                  <p className="mt-1 text-xs text-slate-400">
                    {brl(g.saved)} de {brl(g.target)} ({pct((g.saved / g.target) * 100)})
                    {g.deadline && ` · até ${fmtDate(g.deadline)}`}
                  </p>
                  <form
                    onSubmit={(e) => { e.preventDefault(); const v = deposit[g.id]; if (v) run(async () => { await api(`/api/goals/${g.id}`, { method: "PATCH", json: { deposit: v } }); setDeposit({ ...deposit, [g.id]: "" }); }); }}
                    className="mt-2 flex gap-2"
                  >
                    <input inputMode="decimal" value={deposit[g.id] ?? ""} onChange={(e) => setDeposit({ ...deposit, [g.id]: e.target.value })} placeholder="Guardar (use - para retirar)" aria-label={`Valor para ${g.name}`} className={input} />
                    <button className={btnGhost}>Aplicar</button>
                  </form>
                </li>
              );
            })}
            {goals.length === 0 && <li className="text-sm text-slate-500">Nenhuma meta criada ainda.</li>}
          </ul>

          <form
            onSubmit={(e) => { e.preventDefault(); run(async () => { await api("/api/goals", { method: "POST", json: gf }); setGf({ name: "", target: "", deadline: "" }); }); }}
            className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-4"
          >
            <Field label="Nova meta" className="col-span-2"><input value={gf.name} onChange={(e) => setGf({ ...gf, name: e.target.value })} placeholder="Ex: Reserva de emergência" className={input} /></Field>
            <Field label="Valor alvo (R$)"><input inputMode="decimal" value={gf.target} onChange={(e) => setGf({ ...gf, target: e.target.value })} className={input} /></Field>
            <Field label="Prazo (opcional)"><input type="date" value={gf.deadline} onChange={(e) => setGf({ ...gf, deadline: e.target.value })} className={input} /></Field>
            <button className={`${btn} col-span-2`} disabled={!gf.name || !gf.target}><Plus className="h-4 w-4" /> Criar meta</button>
          </form>
        </section>
      </div>
    </main>
  );
}
