import { db } from "./db";
import { chave } from "./prazos";

/** Feriados gerais e os do tribunal informado, como AAAA-MM-DD. */
export async function feriadosPara(tribunal: string | null | undefined): Promise<string[]> {
  const lista = await db.feriado.findMany({
    where: { OR: [{ tribunal: null }, ...(tribunal ? [{ tribunal: tribunal.toUpperCase() }] : [])] },
    select: { data: true },
  });
  return lista.map((f) => chave(f.data));
}
