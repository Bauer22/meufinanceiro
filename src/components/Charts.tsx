import { brl, monthLabel } from "@/lib/format";

const compact = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (a >= 1000) return `${(v / 1000).toFixed(a >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(v));
};

/** Arredonda o teto do eixo para um número "redondo". */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

const W = 640, H = 260, L = 48, R = 12, T = 12, B = 30;

export function MonthlyBars({ data }: { data: { month: string; income: number; expense: number }[] }) {
  const max = niceMax(Math.max(...data.map((d) => Math.max(d.income, d.expense)), 0));
  const cw = (W - L - R) / data.length;
  const bw = Math.min(cw * 0.32, 26);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Receitas e despesas por mês" className="h-auto w-full">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#1e293b" />
          <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{compact(t)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = L + cw * i + cw / 2;
        return (
          <g key={d.month}>
            <rect x={cx - bw - 1} y={y(d.income)} width={bw} height={y(0) - y(d.income)} rx="3" fill="#10b981">
              <title>{`${monthLabel(d.month)} — receitas ${brl(d.income)}`}</title>
            </rect>
            <rect x={cx + 1} y={y(d.expense)} width={bw} height={y(0) - y(d.expense)} rx="3" fill="#f43f5e">
              <title>{`${monthLabel(d.month)} — despesas ${brl(d.expense)}`}</title>
            </rect>
            <text x={cx} y={H - 10} textAnchor="middle" fontSize="11" fill="#94a3b8">{monthLabel(d.month)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function BalanceLine({ data }: { data: { month: string; value: number }[] }) {
  const vals = data.map((d) => d.value);
  const lo = Math.min(0, ...vals);
  const hi = Math.max(0, ...vals);
  const span = hi - lo || 1;
  const x = (i: number) => L + ((W - L - R) * (data.length === 1 ? 0.5 : i / (data.length - 1)));
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / span);
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const ticks = [lo, lo + span / 2, hi];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Evolução do saldo" className="h-auto w-full">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#1e293b" />
          <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{compact(t)}</text>
        </g>
      ))}
      {lo < 0 && <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="#475569" strokeDasharray="4 4" />}
      <path d={path} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.month}>
          <circle cx={x(i)} cy={y(d.value)} r="4" fill="#38bdf8">
            <title>{`${monthLabel(d.month)} — saldo ${brl(d.value)}`}</title>
          </circle>
          <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#94a3b8">{monthLabel(d.month)}</text>
        </g>
      ))}
    </svg>
  );
}

const PALETTE = ["#38bdf8", "#f59e0b", "#a78bfa", "#f43f5e", "#10b981", "#fb923c", "#e879f9", "#94a3b8"];

/** Barras horizontais por categoria, com valor e % do total. */
export function CategoryBars({ data }: { data: { category: string; total: number }[] }) {
  const total = data.reduce((a, d) => a + d.total, 0) || 1;
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={d.category}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{d.category}</span>
            <span className="text-slate-400">{brl(d.total)} · {((d.total / total) * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-800">
            <div className="h-full rounded-full" style={{ width: `${(d.total / max) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
