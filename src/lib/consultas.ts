import { db } from "./db";

/** Usuários que podem ser responsáveis por processos e prazos. */
export function listarAdvogados() {
  return db.usuario.findMany({
    where: { ativo: true, perfil: { in: ["SOCIO", "ADVOGADO"] } },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
}

export function listarUsuariosAtivos() {
  return db.usuario.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } });
}

export function listarClientesResumo() {
  return db.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } });
}
