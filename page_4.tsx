"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Check, Trash2, ListTodo, Receipt } from "lucide-react";
import { api, errMsg } from "@/lib/client";
import { brl } from "@/lib/format";
import { addMonths, daysInMonth, keyOf, todayParts } from "@/lib/dates";
import { btn, btnGhost, card, ErrorBox, Field, input, PageTitle } from "@/components/ui";

type TaskItem = {
  id: string; title: string; notes: string | null; kind: "TASK" | "BILL";
  amount: number | null; dueDate: string; done: boolean;
};
type RecOccurrence = {
  id: string; recurringId: string; description: string; amount: number;
  type: "INCOME" | "EXPENSE"; category: string; account: { name: string } | null; dueDate: string;
};
type CalendarData = { tasks: TaskItem[]; recurringOccurrences: RecOccurrence[] };

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Dia (1-31) de uma data ISO gravada ao meio-dia UTC. */
const dayOf = (iso: string) => new Date(iso).getUTCDate();

export default function Calendario() {
  const t0 = todayParts();
  const [monthKey, setMonthKey] = useState(keyOf(t0.y, t0.m));
  const [data, setData] = useState<CalendarData>({ tasks: [], recurringOccurrences: [] });
  const [selectedDay, setSelectedDay] = useState<number>(t0.d);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ title: "", kind: "TASK" as "TASK" | "BILL", amount: "", notes: "" });

  const [y, m] = monthKey.split("-").map(Number);
  const isCurrentMonth = monthKey === keyOf(t0.y, t0.m);

  const load = useCallback(async () => {
    try {
      setData(await api<CalendarData>(`/api/calendar?month=${monthKey}`));
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [monthKey]);

  useEffect(() => { load(); }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<number, { tasks: TaskItem[]; bills: RecOccurrence[] }>();
    for (const t of data.tasks) {
      const d = dayOf(t.dueDate);
      if (!map.has(d)) map.set(d, { tasks: [], bills: [] });
      map.get(d)!.tasks.push(t);
    }
    for (const b of data.recurringOccurrences) {
      const d = dayOf(b.dueDate);
      if (!map.has(d)) map.set(d, { tasks: [], bills: [] });
      map.get(d)!.bills.push(b);
    }
    return map;
  }, [data]);

  const dim = daysInMonth(y, m);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];

  const changeMonth = (delta: number) => {
    const next = addMonths(y, m, delta);
    setMonthKey(keyOf(next.y, next.m));
    setSelectedDay(1);
  };
  const goToday = () => {
    setMonthKey(keyOf(t0.y, t0.m));
    setSelectedDay(t0.d);
  };

  const dueDateISO = (day: number) => `${monthKey}-${String(day).padStart(2, "0")}`;

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/tasks", {
        method: "POST",
        json: {
          title: f.title,
          kind: f.kind,
          dueDate: dueDateISO(selectedDay),
          amount: f.kind === "BILL" && f.amount ? f.amount : undefined,
          notes: f.notes || undefined,
        },
      });
      setF({ title: "", kind: "TASK", amount: "", notes: "" });
      load();
    } catch (x) {
      setError(errMsg(x));
    } finally {
      setBusy(false);
    }
  };

  const toggleDone = async (item: TaskItem) => {
    try { await api(`/api/tasks/${item.id}`, { method: "PATCH", json: { done: !item.done } }); load(); }
    catch (x) { setError(errMsg(x)); }
  };
  const removeItem = async (item: TaskItem) => {
    if (!confirm(`Apagar "${item.title}"?`)) return;
    try { await api(`/api/tasks/${item.id}`, { method: "DELETE" }); load(); }
    catch (x) { setError(errMsg(x)); }
  };

  const selected = byDay.get(selectedDay) ?? { tasks: [], bills: [] };

  return (
    <main className="p-4 md:p-8">
      <PageTitle icon={<CalendarDays className="text-emerald-500" />}>Calendário</PageTitle>
      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} aria-label="Mês anterior" className={btnGhost}><ChevronLeft className="h-4 w-4" /></button>
          <h2 className="w-44 text-center text-lg font-semibold">{MONTHS[m - 1]} {y}</h2>
          <button onClick={() => changeMonth(1)} aria-label="Próximo mês" className={btnGhost}><ChevronRight className="h-4 w-4" /></button>
        </div>
        {!isCurrentMonth && <button onClick={goToday} className={btnGhost}>Hoje</button>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`}>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
            {WEEKDAYS.map((w) => <div key={w} className="pb-2">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const info = byDay.get(day);
              const isToday = isCurrentMonth && day === t0.d;
              const isSelected = day === selectedDay;
              const pendingTasks = info?.tasks.filter((t) => !t.done) ?? [];
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[4.5rem] rounded-lg border p-1.5 text-left align-top text-xs transition ${
                    isSelected ? "border-emerald-500 bg-emerald-950/30" : "border-slate-800 hover:border-slate-600"
                  }`}
                >
                  <span className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${isToday ? "bg-emerald-600 text-white" : "text-slate-400"}`}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {pendingTasks.slice(0, 2).map((t) => (
                      <p key={t.id} className="truncate text-slate-300">• {t.title}</p>
                    ))}
                    {info?.bills.slice(0, 2).map((b) => (
                      <p key={b.id} className="truncate text-amber-300">• {b.description}</p>
                    ))}
                    {(pendingTasks.length + (info?.bills.length ?? 0)) > 2 && (
                      <p className="text-slate-500">+{pendingTasks.length + (info?.bills.length ?? 0) - 2}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          <section className={card}>
            <h3 className="mb-3 text-sm font-semibold text-slate-300">
              Dia {selectedDay} de {MONTHS[m - 1]}
            </h3>
            {selected.tasks.length === 0 && selected.bills.length === 0 && (
              <p className="text-sm text-slate-500">Nada agendado para este dia.</p>
            )}
            <ul className="space-y-2">
              {selected.tasks.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-800 p-2">
                  <div className="min-w-0">
                    <p className={`flex items-center gap-1.5 text-sm ${t.done ? "text-slate-500 line-through" : ""}`}>
                      {t.kind === "BILL" ? <Receipt className="h-3.5 w-3.5 shrink-0 text-amber-400" /> : <ListTodo className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                      {t.title}
                    </p>
                    {t.amount != null && <p className="text-xs text-slate-500">{brl(t.amount)}</p>}
                    {t.notes && <p className="text-xs text-slate-500">{t.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => toggleDone(t)} aria-label={t.done ? "Reabrir" : "Concluir"} className="text-slate-500 hover:text-emerald-400">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeItem(t)} aria-label={`Apagar ${t.title}`} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
              {selected.bills.map((b) => (
                <li key={b.id} className="rounded-lg border border-amber-900 bg-amber-950/20 p-2">
                  <p className="flex items-center gap-1.5 text-sm text-amber-200"><Receipt className="h-3.5 w-3.5 shrink-0" /> {b.description}</p>
                  <p className="text-xs text-amber-300/80">
                    Recorrente · {brl(b.amount)}{b.account ? ` · ${b.account.name}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <h3 className="mb-3 text-sm font-semibold text-slate-300">Adicionar ao dia {selectedDay}</h3>
            <form onSubmit={addItem} className="space-y-3">
              <Field label="Título">
                <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex: Pagar IPVA" className={input} />
              </Field>
              <Field label="Tipo">
                <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as "TASK" | "BILL" })} className={input}>
                  <option value="TASK">Afazer</option>
                  <option value="BILL">Conta a pagar</option>
                </select>
              </Field>
              {f.kind === "BILL" && (
                <Field label="Valor (R$) — opcional">
                  <input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={input} />
                </Field>
              )}
              <Field label="Observações — opcional">
                <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={input} />
              </Field>
              <button className={`${btn} w-full`} disabled={busy || !f.title}>
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </form>
          </section>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Contas recorrentes cadastradas em <a href="/recorrentes" className="underline">Recorrentes</a> aparecem aqui automaticamente, todo mês.
      </p>
    </main>
  );
}
