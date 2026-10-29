import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { Formulario } from "@/components/Formulario";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { CamposCliente } from "../CamposCliente";
import { editarCliente } from "../acoes";
import { formatarData } from "@/lib/formatos";
import type { Cliente } from "@prisma/client";

function DadosComplementares({ cliente }: { cliente: Cliente }) {
  const extras = (cliente.dadosExtras ?? {}) as Record<string, string>;
  const itens: [string, string | null | undefined][] = [
    ["Apelido", cliente.apelido],
    ["Cidade", [cliente.cidade, cliente.uf].filter(Boolean).join(" / ")],
    ["CEP", cliente.cep],
    ["Nascimento", formatarData(cliente.dataNascimento)],
    ["Estado civil", cliente.estadoCivil],
    ["Nacionalidade", cliente.nacionalidade],
    ["Profissão", cliente.profissao],
    ["Mãe", cliente.nomeMae],
    ["Pai", cliente.nomePai],
    ...Object.entries(extras),
  ];
  const preenchidos = itens.filter(([, v]) => v);
  if (!preenchidos.length) return null;
  return (
    <section className="cartao text-sm">
      <h2 className="mb-2 font-semibold">Dados complementares</h2>
      <dl className="grid gap-x-4 gap-y-1 md:grid-cols-2">
        {preenchidos.map(([k, v]) => (
          <div key={k}><dt className="inline text-slate-500">{k}: </dt><dd className="inline">{v}</dd></div>
        ))}
      </dl>
    </section>
  );
}

export default async function DetalheCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  const cliente = await db.cliente.findUnique({
    where: { id },
    include: { processos: { include: { processo: true } } },
  });
  if (!cliente) notFound();
  const podeEditar = pode(usuario.perfil, "clientes:editar");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/clientes" className="link text-sm">Clientes</Link>
        <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
        <Link href={`/documentos?cliente=${cliente.id}`} className="link text-sm">Gerar documento</Link>
        {!cliente.ehCliente && <p className="text-sm text-slate-500">Contato (parte contrária, testemunha ou outro envolvido)</p>}
      </div>
      <section className="cartao space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Processos e casos</h2>
          {podeEditar && <Link href={`/processos/novo?cliente=${cliente.id}`} className="link text-sm">Novo processo</Link>}
        </div>
        <ul className="space-y-1 text-sm">
          {cliente.processos.map(({ processo: p, polo }) => (
            <li key={p.id}>
              <Link href={`/processos/${p.id}`} className="link">{p.titulo}</Link>
              <span className="text-slate-500"> {p.numeroCnj ?? p.numeroAlternativo ?? "sem número"}{polo ? ` · ${polo}` : ""}</span>
            </li>
          ))}
          {cliente.processos.length === 0 && <li className="text-slate-500">Nenhum processo vinculado.</li>}
        </ul>
      </section>
      <DadosComplementares cliente={cliente} />
      {podeEditar ? (
        <Formulario acao={editarCliente.bind(null, cliente.id)} className="cartao space-y-4">
          <h2 className="font-semibold">Dados cadastrais</h2>
          <CamposCliente cliente={cliente} />
          <BotaoEnviar>Salvar alterações</BotaoEnviar>
        </Formulario>
      ) : (
        <section className="cartao text-sm">
          <p>CPF/CNPJ: {cliente.cpfCnpj}</p>
          <p>E-mail: {cliente.email}</p>
          <p>Telefone: {cliente.telefone}</p>
          <p>Endereço: {cliente.endereco}</p>
        </section>
      )}
    </div>
  );
}
