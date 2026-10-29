import Link from "next/link";

export function AbasFinanceiro({ ativa }: { ativa: "lancamentos" | "faturas" }) {
  const aba = (id: string, href: string, rotulo: string) => (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-3 py-2 text-sm ${ativa === id ? "border-marca-600 font-medium text-marca-700" : "border-transparent text-slate-500"}`}
    >
      {rotulo}
    </Link>
  );
  return (
    <nav className="flex gap-1 border-b border-slate-200">
      {aba("lancamentos", "/financeiro", "Lançamentos")}
      {aba("faturas", "/financeiro/faturas", "Faturas")}
    </nav>
  );
}
