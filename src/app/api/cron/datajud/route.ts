import { NextResponse } from "next/server";
import { sincronizarTodos } from "@/lib/datajud";
import { vincularPorNumero } from "@/lib/publicacoes";

// Chamado pelo agendador da hospedagem (ex.: 3 vezes ao dia) com o cabeçalho
// Authorization: Bearer <CRON_SECRET>.
export const maxDuration = 800;

export async function POST(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const chave = process.env.DATAJUD_API_KEY;
  if (!chave) return NextResponse.json({ erro: "DATAJUD_API_KEY não configurada" }, { status: 500 });
  const resultado = await sincronizarTodos(chave);
  const publicacoesVinculadas = await vincularPorNumero();
  return NextResponse.json({ ...resultado, publicacoesVinculadas });
}
