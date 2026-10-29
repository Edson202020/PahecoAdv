import { Menu } from "@/components/Menu";
import { usuarioAtual } from "@/lib/auth";
import { NOMES_PERFIL, pode } from "@/lib/permissoes";

export default async function LayoutSistema({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  const itens = [
    { href: "/", rotulo: "Painel" },
    { href: "/agenda", rotulo: "Agenda e prazos" },
    { href: "/publicacoes", rotulo: "Publicações" },
    { href: "/processos", rotulo: "Processos" },
    { href: "/clientes", rotulo: "Clientes" },
    ...(pode(usuario.perfil, "usuarios:gerenciar")
      ? [
          { href: "/usuarios", rotulo: "Usuários" },
          { href: "/feriados", rotulo: "Feriados" },
        ]
      : []),
  ];
  return (
    <div className="md:flex">
      <Menu itens={itens} nome={usuario.nome} perfil={NOMES_PERFIL[usuario.perfil]} />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
