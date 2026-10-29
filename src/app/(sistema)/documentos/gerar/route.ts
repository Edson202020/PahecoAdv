import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { gerarDocx } from "@/lib/documentos";
import { camposPara } from "@/lib/campos-documento";
import { registrar } from "@/lib/auditoria";

export async function GET(request: Request) {
  const usuario = await usuarioAtual();
  const params = new URL(request.url).searchParams;
  const modelo = await db.modeloDocumento.findUnique({ where: { id: params.get("modelo") ?? "" } });
  if (!modelo) return NextResponse.json({ erro: "Modelo não encontrado" }, { status: 404 });
  const { campos, nomeArquivo } = await camposPara({
    clienteId: params.get("cliente") || undefined,
    processoId: params.get("processo") || undefined,
    usuarioId: usuario.id,
  });
  const arquivo = await gerarDocx(modelo.conteudo, campos);
  await registrar(usuario.id, "gerar_documento", "ModeloDocumento", modelo.id, {
    cliente: params.get("cliente"),
    processo: params.get("processo"),
  });
  const nome = `${modelo.nome} - ${nomeArquivo}`.replace(/[\\/:*?"<>|]/g, "").slice(0, 150);
  return new NextResponse(new Uint8Array(arquivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nome.normalize("NFD").replace(/[^\x20-\x7e]/g, "")}.docx"; filename*=UTF-8''${encodeURIComponent(nome)}.docx`,
    },
  });
}
