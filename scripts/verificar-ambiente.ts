// Roda antes do build da Vercel e explica, em português, qual configuração está faltando.
const obrigatorias = ["DATABASE_URL", "DIRECT_URL", "NEXTAUTH_SECRET"];
const problemas: string[] = [];

for (const nome of obrigatorias) {
  if (!process.env[nome]?.trim()) problemas.push(`Variável ${nome} não cadastrada na Vercel (ou não marcada para este ambiente: ${process.env.VERCEL_ENV ?? "local"}).`);
}
for (const nome of ["DATABASE_URL", "DIRECT_URL"]) {
  const valor = process.env[nome];
  if (!valor) continue;
  if (!/^postgres(ql)?:\/\//.test(valor)) problemas.push(`${nome} deve começar com postgresql://`);
  if (/\[YOUR-PASSWORD\]|\[SUA-SENHA\]/i.test(valor)) problemas.push(`${nome} ainda tem [YOUR-PASSWORD]: troque pela senha do banco do Supabase.`);
}
if (process.env.DATABASE_URL?.includes(":6543") && !process.env.DATABASE_URL.includes("pgbouncer=true")) {
  problemas.push("DATABASE_URL usa a porta 6543 do Supabase e precisa terminar com ?pgbouncer=true");
}
if (process.env.ADMIN_SENHA && process.env.ADMIN_SENHA.length < 10) problemas.push("ADMIN_SENHA precisa de ao menos 10 caracteres.");
for (const nome of ["NEXTAUTH_URL", "CRON_SECRET", "DATAJUD_API_KEY", "AASP_API_KEY"]) {
  if (!process.env[nome]?.trim()) console.warn(`Aviso: ${nome} não cadastrada (o sistema sobe, mas a função correspondente fica desligada).`);
}

if (problemas.length) {
  console.error("\nCONFIGURAÇÃO INCOMPLETA:\n- " + problemas.join("\n- ") + "\n");
  process.exit(1);
}
console.log("Configuração verificada.");
