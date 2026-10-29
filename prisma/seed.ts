// Carga inicial: primeiro usuário (sócio) e feriados nacionais fixos.
// Uso: ADMIN_NOME="..." ADMIN_EMAIL="..." ADMIN_SENHA="..." npm run seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Lei 662/1949 (redação da Lei 10.607/2002), Lei 6.802/1980 (12/10) e Lei 14.759/2023 (20/11).
const NACIONAIS: [string, string][] = [
  ["01-01", "Confraternização Universal"],
  ["04-21", "Tiradentes"],
  ["05-01", "Dia do Trabalho"],
  ["09-07", "Independência do Brasil"],
  ["10-12", "Nossa Senhora Aparecida"],
  ["11-02", "Finados"],
  ["11-15", "Proclamação da República"],
  ["11-20", "Dia Nacional de Zumbi e da Consciência Negra"],
  ["12-25", "Natal"],
];

async function main() {
  const { ADMIN_NOME, ADMIN_EMAIL, ADMIN_SENHA } = process.env;
  if (ADMIN_EMAIL && ADMIN_SENHA) {
    if (ADMIN_SENHA.length < 10) throw new Error("ADMIN_SENHA precisa de ao menos 10 caracteres.");
    await db.usuario.upsert({
      where: { email: ADMIN_EMAIL.toLowerCase() },
      update: {},
      create: {
        nome: ADMIN_NOME ?? "Administrador",
        email: ADMIN_EMAIL.toLowerCase(),
        perfil: "SOCIO",
        senhaHash: await bcrypt.hash(ADMIN_SENHA, 12),
      },
    });
    console.log(`Usuário sócio ${ADMIN_EMAIL} pronto.`);
  }

  const ano = new Date().getUTCFullYear();
  for (const a of [ano, ano + 1]) {
    for (const [mmdd, descricao] of NACIONAIS) {
      const data = new Date(`${a}-${mmdd}T00:00:00Z`);
      const existe = await db.feriado.findFirst({ where: { data, tribunal: null } });
      if (!existe) await db.feriado.create({ data: { data, descricao } });
    }
  }
  console.log(`Feriados nacionais de ${ano} e ${ano + 1} cadastrados.`);
}

main().finally(() => db.$disconnect());
