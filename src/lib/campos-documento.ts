import { db } from "./db";
import { dataPorExtenso } from "./documentos";
import { formatarMoeda, mascararCpfCnpj } from "./formatos";

/** Monta os valores dos {{campos}} a partir do cliente, do processo e do advogado. */
export async function camposPara(opcoes: { clienteId?: string; processoId?: string; usuarioId: string }) {
  const [cliente, processo] = await Promise.all([
    opcoes.clienteId ? db.cliente.findUnique({ where: { id: opcoes.clienteId } }) : null,
    opcoes.processoId
      ? db.processo.findUnique({ where: { id: opcoes.processoId }, include: { responsavel: true } })
      : null,
  ]);
  const advogado = processo?.responsavel ?? (await db.usuario.findUnique({ where: { id: opcoes.usuarioId } }));
  const campos: Record<string, string | null | undefined> = {
    "data.hoje": dataPorExtenso(new Date()),
    "advogado.nome": advogado?.nome,
    "advogado.oab": advogado?.oab,
  };
  if (cliente) {
    const doc = mascararCpfCnpj(cliente.cpfCnpj);
    const local = [cliente.endereco, [cliente.cidade, cliente.uf].filter(Boolean).join("/"), cliente.cep && `CEP ${cliente.cep}`]
      .filter(Boolean)
      .join(", ");
    const falta = (nome: string) => `[PREENCHER: ${nome}]`;
    const qualificacao =
      cliente.tipo === "JURIDICA"
        ? `pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${doc || falta("CNPJ")}, com sede na ${local || falta("endereço")}`
        : [
            cliente.nacionalidade ?? falta("nacionalidade"),
            cliente.estadoCivil?.toLowerCase() ?? falta("estado civil"),
            cliente.profissao?.toLowerCase() ?? falta("profissão"),
            `portador(a) do RG nº ${cliente.rg ?? falta("RG")}`,
            `inscrito(a) no CPF sob o nº ${doc || falta("CPF")}`,
            `residente e domiciliado(a) na ${local || falta("endereço")}`,
          ].join(", ");
    Object.assign(campos, {
      "cliente.nome": cliente.nome,
      "cliente.qualificacao": qualificacao,
      "cliente.cpfCnpj": doc,
      "cliente.rg": cliente.rg,
      "cliente.nacionalidade": cliente.nacionalidade,
      "cliente.estadoCivil": cliente.estadoCivil,
      "cliente.profissao": cliente.profissao,
      "cliente.endereco": cliente.endereco,
      "cliente.cidade": cliente.cidade,
      "cliente.uf": cliente.uf,
      "cliente.cep": cliente.cep,
      "cliente.email": cliente.email,
      "cliente.telefone": cliente.telefone,
    });
  }
  if (processo) {
    Object.assign(campos, {
      "processo.numero": processo.numeroCnj ?? processo.numeroAlternativo,
      "processo.titulo": processo.titulo,
      "processo.vara": processo.vara,
      "processo.comarca": processo.comarca,
      "processo.tribunal": processo.tribunal,
      "processo.parteContraria": processo.parteContraria,
      "processo.valorCausa": processo.valorCausa ? formatarMoeda(processo.valorCausa) : null,
    });
  }
  const nomeArquivo = [cliente?.nome, processo?.titulo].filter(Boolean).join(" - ") || "documento";
  return { campos, nomeArquivo };
}
