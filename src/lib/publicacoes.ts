import { db } from "./db";

/** Liga publicações sem processo ao processo de mesmo número CNJ. Devolve quantas foram ligadas. */
export async function vincularPorNumero(): Promise<number> {
  const soltas = await db.publicacao.findMany({
    where: { processoId: null, numeroProcesso: { not: null } },
    select: { id: true, numeroProcesso: true },
  });
  if (!soltas.length) return 0;
  const processos = await db.processo.findMany({
    where: { numeroCnj: { in: [...new Set(soltas.map((p) => p.numeroProcesso!))] } },
    select: { id: true, numeroCnj: true, responsavelId: true },
  });
  const porNumero = new Map(processos.map((p) => [p.numeroCnj!, p]));
  let ligadas = 0;
  for (const pub of soltas) {
    const processo = porNumero.get(pub.numeroProcesso!);
    if (!processo) continue;
    await db.publicacao.update({
      where: { id: pub.id },
      data: { processoId: processo.id, responsavelId: processo.responsavelId },
    });
    ligadas++;
  }
  return ligadas;
}
