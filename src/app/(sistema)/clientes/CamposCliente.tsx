import type { Cliente } from "@prisma/client";

export function CamposCliente({ cliente }: { cliente?: Cliente }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="rotulo" htmlFor="tipo">Tipo</label>
        <select id="tipo" name="tipo" defaultValue={cliente?.tipo ?? "FISICA"} className="campo">
          <option value="FISICA">Pessoa física</option>
          <option value="JURIDICA">Pessoa jurídica</option>
        </select>
      </div>
      <div>
        <label className="rotulo" htmlFor="nome">Nome ou razão social</label>
        <input id="nome" name="nome" required defaultValue={cliente?.nome} className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="cpfCnpj">CPF ou CNPJ</label>
        <input id="cpfCnpj" name="cpfCnpj" inputMode="numeric" defaultValue={cliente?.cpfCnpj ?? ""} className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="rg">RG</label>
        <input id="rg" name="rg" defaultValue={cliente?.rg ?? ""} className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" defaultValue={cliente?.email ?? ""} className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="telefone">Telefone</label>
        <input id="telefone" name="telefone" type="tel" defaultValue={cliente?.telefone ?? ""} className="campo" />
      </div>
      <div className="md:col-span-2">
        <label className="rotulo" htmlFor="endereco">Endereço</label>
        <input id="endereco" name="endereco" defaultValue={cliente?.endereco ?? ""} className="campo" />
      </div>
      <div className="md:col-span-2">
        <label className="rotulo" htmlFor="observacoes">Observações</label>
        <textarea id="observacoes" name="observacoes" rows={3} defaultValue={cliente?.observacoes ?? ""} className="campo" />
      </div>
    </div>
  );
}
