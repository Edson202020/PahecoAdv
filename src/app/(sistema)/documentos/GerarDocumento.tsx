"use client";

import { useState } from "react";

export function GerarDocumento({
  modelos,
  clientes,
  processos,
  clienteInicial,
  processoInicial,
}: {
  modelos: { id: string; nome: string }[];
  clientes: { id: string; nome: string }[];
  processos: { id: string; titulo: string; clientes: string[] }[];
  clienteInicial: string;
  processoInicial: string;
}) {
  const [modelo, setModelo] = useState(modelos[0]?.id ?? "");
  const [processo, setProcesso] = useState(processoInicial);
  const [cliente, setCliente] = useState(clienteInicial || processos.find((p) => p.id === processoInicial)?.clientes[0] || "");
  const processosDoCliente = cliente ? processos.filter((p) => p.clientes.includes(cliente)) : processos;
  const link = `/documentos/gerar?${new URLSearchParams({ modelo, ...(cliente && { cliente }), ...(processo && { processo }) })}`;

  return (
    <section className="cartao space-y-4">
      <h2 className="font-semibold">Gerar documento no timbrado</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="rotulo" htmlFor="modelo">Modelo</label>
          <select id="modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} className="campo">
            {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="cliente">Cliente</label>
          <select id="cliente" value={cliente} onChange={(e) => { setCliente(e.target.value); setProcesso(""); }} className="campo">
            <option value="">Nenhum</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="processo">Processo</label>
          <select id="processo" value={processo} onChange={(e) => setProcesso(e.target.value)} className="campo">
            <option value="">Nenhum</option>
            {processosDoCliente.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
          </select>
        </div>
      </div>
      {modelo ? (
        <a href={link} className="botao">Baixar em Word</a>
      ) : (
        <p className="text-sm text-slate-500">Cadastre um modelo para gerar documentos.</p>
      )}
      <p className="text-xs text-slate-500">Campos sem informação no cadastro saem em vermelho como [PREENCHER: ...] para completar no Word.</p>
    </section>
  );
}
