import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { listarClientesResumo } from "@/lib/consultas";
import { Formulario } from "@/components/Formulario";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { criarLancamento } from "../acoes";

export default async function NovoLancamento() {
  await exigir("financeiro:editar");
  const [contas, categorias, clientes, processos] = await Promise.all([
    db.contaBancaria.findMany({ where: { ativa: true }, orderBy: { nome: "asc" } }),
    db.categoriaFinanceira.findMany({ where: { ativa: true }, orderBy: { nome: "asc" } }),
    listarClientesResumo(),
    db.processo.findMany({ where: { status: "ATIVO" }, select: { id: true, titulo: true }, orderBy: { titulo: "asc" } }),
  ]);
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Novo lançamento</h1>
      <Formulario acao={criarLancamento} className="cartao space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="rotulo" htmlFor="tipo">Tipo</label>
            <select id="tipo" name="tipo" className="campo"><option value="RECEITA">Receita</option><option value="DESPESA">Despesa</option></select>
          </div>
          <div>
            <label className="rotulo" htmlFor="subtipo">Natureza</label>
            <select id="subtipo" name="subtipo" className="campo">
              <option value="Honorário">Honorário</option>
              <option value="Despesa">Despesa de processo</option>
              <option value="Avulsa">Avulsa</option>
            </select>
          </div>
          <div className="md:col-span-2"><label className="rotulo" htmlFor="descricao">Descrição</label><input id="descricao" name="descricao" required className="campo" /></div>
          <div><label className="rotulo" htmlFor="valor">Valor (R$)</label><input id="valor" name="valor" inputMode="decimal" required className="campo" /></div>
          <div><label className="rotulo" htmlFor="vencimento">Vencimento</label><input id="vencimento" name="vencimento" type="date" required className="campo" /></div>
          <div><label className="rotulo" htmlFor="pagamento">Data do pagamento (se já pago)</label><input id="pagamento" name="pagamento" type="date" className="campo" /></div>
          <div>
            <label className="rotulo" htmlFor="contaId">Conta</label>
            <select id="contaId" name="contaId" className="campo"><option value="">Sem conta</option>{contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
          </div>
          <div>
            <label className="rotulo" htmlFor="categoriaId">Categoria</label>
            <select id="categoriaId" name="categoriaId" className="campo"><option value="">Sem categoria</option>{categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
          </div>
          <div>
            <label className="rotulo" htmlFor="clienteId">Cliente</label>
            <select id="clienteId" name="clienteId" className="campo"><option value="">Nenhum</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
          </div>
          <div className="md:col-span-2">
            <label className="rotulo" htmlFor="processoId">Processo</label>
            <select id="processoId" name="processoId" className="campo"><option value="">Nenhum</option>{processos.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}</select>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="reembolsavel" value="1" /> Despesa a ser reembolsada pelo cliente</label>
        </div>
        <BotaoEnviar>Salvar lançamento</BotaoEnviar>
      </Formulario>
    </div>
  );
}
