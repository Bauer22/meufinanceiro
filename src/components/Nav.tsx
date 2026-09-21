"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/chat", label: "Lançar", Icon: MessageSquare },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="flex gap-2 px-4 pt-4 md:px-8">
      {links.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition ${
            path === href ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-100"
          }`}
        >
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
    </nav>
  );
}
