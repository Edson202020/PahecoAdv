// Busca novos andamentos no DataJud para todos os processos ativos.
// Uso: DATAJUD_API_KEY=... npm run sincronizar:datajud
import { sincronizarTodos } from "../src/lib/datajud";
import { db } from "../src/lib/db";

const chave = process.env.DATAJUD_API_KEY;
if (!chave) {
  console.error("Defina DATAJUD_API_KEY.");
  process.exit(1);
}

sincronizarTodos(chave, (feitos, total) => process.stdout.write(`\r  ${feitos}/${total} processos`))
  .then((r) => {
    console.log(`\n${r.novos} andamentos novos em ${r.processos} processos.`);
    if (r.falhas.length) console.log(`Falhas (${r.falhas.length}):\n  ${r.falhas.slice(0, 20).join("\n  ")}`);
  })
  .finally(() => db.$disconnect());
