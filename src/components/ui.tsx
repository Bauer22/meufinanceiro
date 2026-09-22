import type { ReactNode } from "react";

export const card = "rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6";
export const input =
  "w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none";
export const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50";
export const label = "mb-1 block text-xs text-slate-400";

export function PageTitle({ icon, children, right }: { icon?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
        {icon}
        {children}
      </h1>
      {right}
    </header>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mb-6 rounded-xl border border-rose-900 bg-rose-950/40 p-4 text-sm text-rose-300">
      {children}
    </p>
  );
}

export function Field({ label: l, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={label}>{l}</span>
      {children}
    </label>
  );
}

/** Barra de progresso; cor muda ao se aproximar/ultrapassar o limite. */
export function Progress({ value, max, tone = "limit" }: { value: number; max: number; tone?: "limit" | "goal" }) {
  const ratio = max > 0 ? value / max : 0;
  const w = Math.min(ratio, 1) * 100;
  const color =
    tone === "goal" ? "bg-emerald-500" : ratio >= 1 ? "bg-rose-500" : ratio >= 0.8 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
    </div>
  );
}
