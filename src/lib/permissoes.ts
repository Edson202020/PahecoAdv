import type { Perfil } from "@prisma/client";

// Matriz de permissões da especificação (seção "Perfis de acesso").
export type Permissao =
  | "processos:editar_todos"
  | "processos:editar_proprios"
  | "prazos:criar"
  | "prazos:confirmar"
  | "clientes:editar"
  | "financeiro:ver"
  | "financeiro:editar"
  | "usuarios:gerenciar";

const MATRIZ: Record<Perfil, Permissao[]> = {
  SOCIO: [
    "processos:editar_todos",
    "processos:editar_proprios",
    "prazos:criar",
    "prazos:confirmar",
    "clientes:editar",
    "financeiro:ver",
    "financeiro:editar",
    "usuarios:gerenciar",
  ],
  ADVOGADO: [
    "processos:editar_proprios",
    "prazos:criar",
    "prazos:confirmar",
    "clientes:editar",
    "financeiro:ver",
  ],
  ESTAGIARIO: ["prazos:criar"],
  SECRETARIA: ["prazos:criar", "clientes:editar", "financeiro:ver", "financeiro:editar"],
};

export function pode(perfil: Perfil, permissao: Permissao): boolean {
  return MATRIZ[perfil].includes(permissao);
}

export function podeEditarProcesso(perfil: Perfil, usuarioId: string, responsavelId: string): boolean {
  return (
    pode(perfil, "processos:editar_todos") ||
    (pode(perfil, "processos:editar_proprios") && usuarioId === responsavelId)
  );
}

export const NOMES_PERFIL: Record<Perfil, string> = {
  SOCIO: "Sócio administrador",
  ADVOGADO: "Advogado",
  ESTAGIARIO: "Estagiário",
  SECRETARIA: "Secretaria",
};
