"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  List,
  BarChart3,
  Target,
  Landmark,
  Repeat,
  TrendingUp,
  CalendarDays,
  KeyRound,
  LogOut,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/chat", label: "Lançar", Icon: MessageSquare },
  { href: "/lancamentos", label: "Lançamentos", Icon: List },
  { href: "/calendario", label: "Calendário", Icon: CalendarDays },
  { href: "/relatorios", label: "Relatórios", Icon: BarChart3 },
  { href: "/metas", label: "Metas", Icon: Target },
  { href: "/contas", label: "Contas", Icon: Landmark },
  { href: "/recorrentes", label: "Recorrentes", Icon: Repeat },
  { href: "/investimentos", label: "Investimentos", Icon: TrendingUp },
  { href: "/acesso", label: "Acesso", Icon: KeyRound },
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  if (path === "/login") return null;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <nav aria-label="Principal" className="flex items-center gap-1 overflow-x-auto px-4 pt-4 md:px-8">
      {links.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={path === href ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
            path === href ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-100"
          }`}
        >
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
      <button onClick={logout} className="ml-auto flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-rose-400">
        <LogOut className="h-4 w-4" /> Sair
      </button>
    </nav>
  );
}
