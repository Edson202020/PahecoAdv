// Uso: npm run sincronizar:aasp -- [AAAA-MM-DD] (padrão: hoje). Lê AASP_API_KEY do ambiente.
import { importarIntimacoes } from "../src/lib/aasp";
import { vincularPorNumero } from "../src/lib/publicacoes";
import { db } from "../src/lib/db";

async function main() {
  const chave = process.env.AASP_API_KEY;
  if (!chave) throw new Error("Defina AASP_API_KEY no .env");
  const dia = process.argv[2];
  const r = await importarIntimacoes(chave, dia ? new Date(`${dia}T12:00:00Z`) : new Date());
  console.log(`Intimações recebidas: ${r.recebidas}, novas: ${r.novas}, vinculadas a processos: ${await vincularPorNumero()}`);
}

main().finally(() => db.$disconnect());
