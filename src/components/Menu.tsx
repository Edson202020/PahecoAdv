"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface Item {
  href: string;
  rotulo: string;
}

export function Menu({ itens, nome, perfil }: { itens: Item[]; nome: string; perfil: string }) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));

  return (
    <>
      <header className="flex items-center justify-between bg-marca-900 px-4 py-3 text-white md:hidden">
        <span className="font-semibold">Pachecos Advogados</span>
        <button onClick={() => setAberto(!aberto)} aria-label="Abrir menu" className="text-2xl leading-none">
          ☰
        </button>
      </header>
      <nav
        className={`${aberto ? "block" : "hidden"} w-full shrink-0 bg-marca-900 text-white md:sticky md:top-0 md:block md:h-screen md:w-60`}
      >
        <div className="hidden px-5 py-6 md:block">
          <p className="text-lg font-semibold">Pachecos Advogados</p>
          <p className="text-xs text-marca-100">Gestão do escritório</p>
        </div>
        <ul className="space-y-1 px-3 pb-3">
          {itens.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setAberto(false)}
                className={`block rounded-md px-3 py-2 text-sm ${ativo(item.href) ? "bg-marca-600" : "hover:bg-marca-700"}`}
              >
                {item.rotulo}
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-marca-700 px-5 py-4 text-sm">
          <p className="font-medium">{nome}</p>
          <p className="text-xs text-marca-100">{perfil}</p>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="mt-2 text-xs underline">
            Sair
          </button>
        </div>
      </nav>
    </>
  );
}
