import { NextResponse } from "next/server";
import { importarIntimacoes } from "@/lib/aasp";
import { vincularPorNumero } from "@/lib/publicacoes";

// Chamado pelo Cron da Vercel (vercel.json) com Authorization: Bearer <CRON_SECRET>.
// Busca as intimações de hoje; ?data=AAAA-MM-DD permite reprocessar um dia.
export const maxDuration = 300;

async function executar(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const chave = process.env.AASP_API_KEY;
  if (!chave) return NextResponse.json({ erro: "AASP_API_KEY não configurada" }, { status: 500 });
  const dia = new URL(request.url).searchParams.get("data");
  const resultado = await importarIntimacoes(chave, dia ? new Date(`${dia}T12:00:00Z`) : new Date());
  const publicacoesVinculadas = await vincularPorNumero();
  return NextResponse.json({ ...resultado, publicacoesVinculadas });
}

export { executar as GET, executar as POST };
