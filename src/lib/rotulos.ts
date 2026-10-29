import type { AreaDireito, StatusProcesso, TipoCompromisso } from "@prisma/client";

export const AREAS: Record<AreaDireito, string> = {
  TRABALHISTA: "Trabalhista",
  CIVEL: "Cível",
  FAMILIA_SUCESSOES: "Família e sucessões",
  SOCIETARIO: "Societário",
  IMOBILIARIO: "Imobiliário",
  TRIBUTARIO: "Tributário",
  PREVIDENCIARIO: "Previdenciário",
  CRIMINAL: "Criminal",
  OUTRA: "Outra",
};

export const STATUS_PROCESSO: Record<StatusProcesso, string> = {
  ATIVO: "Ativo",
  SUSPENSO: "Suspenso",
  ARQUIVADO: "Arquivado",
  ENCERRADO: "Encerrado",
};

export const TIPOS_COMPROMISSO: Record<TipoCompromisso, string> = {
  PRAZO: "Prazo",
  AUDIENCIA: "Audiência",
  REUNIAO: "Reunião",
  TAREFA: "Tarefa",
};
