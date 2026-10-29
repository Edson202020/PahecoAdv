import { NextResponse } from "next/server";
import { sincronizarTodos } from "@/lib/datajud";
import { vincularPorNumero } from "@/lib/publicacoes";

// Chamado pelo Cron da Vercel (vercel.json), que envia GET com o cabeçalho
// Authorization: Bearer <CRON_SECRET>. POST fica disponível para chamadas manuais.
export const maxDuration = 300;

async function executar(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const chave = process.env.DATAJUD_API_KEY;
  if (!chave) return NextResponse.json({ erro: "DATAJUD_API_KEY não configurada" }, { status: 500 });
  // Para antes do limite da função; os demais processos ficam para a próxima execução.
  const resultado = await sincronizarTodos(chave, undefined, 240_000);
  const publicacoesVinculadas = await vincularPorNumero();
  return NextResponse.json({ ...resultado, publicacoesVinculadas });
}

export { executar as GET, executar as POST };
