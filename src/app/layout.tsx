import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Meu Financeiro",
  description: "Finanças pessoais e investimentos em BRL, USD e EUR",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}
