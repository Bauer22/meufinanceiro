"use client";
import { useCallback, useEffect, useState } from "react";
import { List, Download, Pencil, Trash2, Plus, X } from "lucide-react";
import { api, errMsg } from "@/lib/client";
import { brl, fmtDate } from "@/lib/format";
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { btn, btnGhost, card, ErrorBox, Field, input, PageTitle } from "@/components/ui";

type Tx = {
  id: string; description: string; amount: number; type: "INCOME" | "EXPENSE"; category: string; date: string;
  accountId: string | null; account: { name: string } | null;
  installmentGroup: string | null; installmentNumber: number | null; installmentTotal: number | null;
};
type Account = { id: string; name: string };
type Listing = { items: Tx[]; total: number; page: number; limit: number; income: number; expense: number };

const PAGE = 25;
const thisMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 7);
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

export default function Lancamentos() {
  const [f, setF] = useState({ month: thisMonth(), type: "", category: "", accountId: "", q: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Listing | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [adding, setAdding] = useState(false);

  const qs = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = new URLSearchParams();
      Object.entries({ ...f, ...extra }).forEach(([k, v]) => v && p.set(k, v));
      return p.toString();
    },
    [f],
  );

  const load = useCallback(async () => {
    try {
      setData(await api<Listing>(`/api/transactions?${qs({ limit: String(PAGE), page: String(page) })}`));
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [qs, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api<Account[]>("/api/accounts").then(setAccounts).catch(() => null); }, []);

  const setFilter = (patch: Partial<typeof f>) => { setF({ ...f, ...patch }); setPage(1); };

  const remove = async (t: Tx) => {
    let scope = "";
    if (t.installmentGroup) {
      if (confirm(`Este lançamento é a parcela ${t.installmentNumber}/${t.installmentTotal}.\n\nOK = apagar TODAS as parcelas\nCancelar = escolher apagar só esta`)) scope = "?scope=group";
      else if (!confirm("Apagar somente esta parcela?")) return;
    } else if (!confirm(`Apagar "${t.description}"?`)) return;
    try { await api(`/api/transactions/${t.id}${scope}`, { method: "DELETE" }); load(); } catch (e) { setError(errMsg(e)); }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE)) : 1;

  return (
    <main className="p-4 md:p-8">
      <PageTitle
        icon={<List className="text-emerald-500" />}
        right={
          <div className="flex gap-2">
            <a href={`/api/export?${qs()}`} className={btnGhost}><Download className="h-4 w-4" /> Exportar CSV</a>
            <button onClick={() => setAdding(true)} className={btn}><Plus className="h-4 w-4" /> Novo</button>
          </div>
        }
      >
        Lançamentos
      </PageTitle>

      {error && <ErrorBox>{error}</ErrorBox>}

      <section className={`${card} mb-6 grid grid-cols-2 gap-3 md:grid-cols-5`}>
        <Field label="Mês"><input type="month" value={f.month} onChange={(e) => setFilter({ month: e.target.value })} className={input} /></Field>
        <Field label="Tipo">
          <select value={f.type} onChange={(e) => setFilter({ type: e.target.value })} className={input}>
            <option value="">Todos</option><option value="INCOME">Receitas</option><option value="EXPENSE">Despesas</option>
          </select>
        </Field>
        <Field label="Categoria">
          <select value={f.category} onChange={(e) => setFilter({ category: e.target.value })} className={input}>
            <option value="">Todas</option>{ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Conta">
          <select value={f.accountId} onChange={(e) => setFilter({ accountId: e.target.value })} className={input}>
            <option value="">Todas</option><option value="none">Sem conta</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Buscar"><input value={f.q} onChange={(e) => setFilter({ q: e.target.value })} placeholder="Descrição…" className={input} /></Field>
        <button onClick={() => { setF({ month: "", type: "", category: "", accountId: "", q: "" }); setPage(1); }} className="col-span-2 text-left text-xs text-slate-400 hover:text-white md:col-span-5">
          Limpar filtros (ver todo o histórico)
        </button>
      </section>

      {data && (
        <p className="mb-3 text-sm text-slate-400">
          {data.total} lançamento(s) · receitas <span className="text-emerald-400">{brl(data.income)}</span> · despesas{" "}
          <span className="text-rose-400">{brl(data.expense)}</span> · resultado{" "}
          <span className={data.income - data.expense >= 0 ? "text-emerald-400" : "text-rose-400"}>{brl(data.income - data.expense)}</span>
        </p>
      )}

      <section className={card}>
        {data && data.items.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum lançamento com esses filtros.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {data?.items.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{t.description}</p>
                  <p className="text-xs text-slate-500">
                    {fmtDate(t.date)} · {t.category}{t.account ? ` · ${t.account.name}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={t.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}>
                    {t.type === "INCOME" ? "+" : "−"} {brl(t.amount)}
                  </span>
                  <button onClick={() => setEditing(t)} aria-label={`Editar ${t.description}`} className="text-slate-500 hover:text-white"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(t)} aria-label={`Excluir ${t.description}`} className="text-slate-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={btnGhost}>Anterior</button>
            <span>Página {page} de {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)} className={btnGhost}>Próxima</button>
          </div>
        )}
      </section>

      {editing && <EditModal tx={editing} accounts={accounts} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {adding && <AddModal accounts={accounts} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
    </main>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 md:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditModal({ tx, accounts, onClose, onSaved }: { tx: Tx; accounts: Account[]; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({
    description: tx.description, amount: String(tx.amount).replace(".", ","), type: tx.type,
    category: tx.category, date: tx.date.slice(0, 10), accountId: tx.accountId ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const cats = Array.from(new Set([v.category, ...(v.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)]));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api(`/api/transactions/${tx.id}`, { method: "PATCH", json: v }); onSaved(); } catch (x) { setErr(errMsg(x)); }
  };
  return (
    <Modal title="Editar lançamento" onClose={onClose}>
      <form onSubmit={save} className="grid grid-cols-2 gap-3">
        <Field label="Descrição" className="col-span-2"><input value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} className={input} /></Field>
        <Field label="Valor (R$)"><input inputMode="decimal" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} className={input} /></Field>
        <Field label="Data"><input type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} className={input} /></Field>
        <Field label="Tipo">
          <select value={v.type} onChange={(e) => setV({ ...v, type: e.target.value as Tx["type"] })} className={input}>
            <option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option>
          </select>
        </Field>
        <Field label="Categoria"><select value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })} className={input}>{cats.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Conta" className="col-span-2">
          <select value={v.accountId} onChange={(e) => setV({ ...v, accountId: e.target.value })} className={input}>
            <option value="">Sem conta</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        {tx.installmentTotal && <p className="col-span-2 text-xs text-slate-500">Parcela {tx.installmentNumber}/{tx.installmentTotal}: a edição vale só para esta parcela.</p>}
        {err && <p role="alert" className="col-span-2 text-sm text-rose-400">{err}</p>}
        <div className="col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={btnGhost}>Cancelar</button><button className={btn}>Salvar</button></div>
      </form>
    </Modal>
  );
}

function AddModal({ accounts, onClose, onSaved }: { accounts: Account[]; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({ description: "", amount: "", type: "EXPENSE", category: "Outros", date: today(), accountId: "", installments: "1" });
  const [err, setErr] = useState<string | null>(null);
  const cats = v.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api("/api/transactions", { method: "POST", json: v }); onSaved(); } catch (x) { setErr(errMsg(x)); }
  };
  return (
    <Modal title="Novo lançamento" onClose={onClose}>
      <form onSubmit={save} className="grid grid-cols-2 gap-3">
        <Field label="Descrição" className="col-span-2"><input autoFocus value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} className={input} /></Field>
        <Field label="Valor total (R$)"><input inputMode="decimal" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} className={input} /></Field>
        <Field label="Data (1ª parcela)"><input type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} className={input} /></Field>
        <Field label="Tipo">
          <select value={v.type} onChange={(e) => setV({ ...v, type: e.target.value, category: "Outros" })} className={input}>
            <option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option>
          </select>
        </Field>
        <Field label="Categoria"><select value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })} className={input}>{cats.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Conta / cartão">
          <select value={v.accountId} onChange={(e) => setV({ ...v, accountId: e.target.value })} className={input}>
            <option value="">Sem conta</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Parcelas"><input type="number" min={1} max={48} value={v.installments} onChange={(e) => setV({ ...v, installments: e.target.value })} className={input} /></Field>
        {err && <p role="alert" className="col-span-2 text-sm text-rose-400">{err}</p>}
        <div className="col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={btnGhost}>Cancelar</button><button className={btn}>Salvar</button></div>
      </form>
    </Modal>
  );
}
