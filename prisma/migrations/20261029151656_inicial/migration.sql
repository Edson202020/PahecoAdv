-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('SOCIO', 'ADVOGADO', 'ESTAGIARIO', 'SECRETARIA');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "AreaDireito" AS ENUM ('TRABALHISTA', 'CIVEL', 'FAMILIA_SUCESSOES', 'SOCIETARIO', 'IMOBILIARIO', 'TRIBUTARIO', 'PREVIDENCIARIO', 'CRIMINAL', 'OUTRA');

-- CreateEnum
CREATE TYPE "StatusProcesso" AS ENUM ('ATIVO', 'SUSPENSO', 'ARQUIVADO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "TipoCompromisso" AS ENUM ('PRAZO', 'AUDIENCIA', 'REUNIAO', 'TAREFA');

-- CreateEnum
CREATE TYPE "StatusCompromisso" AS ENUM ('PENDENTE', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ContagemPrazo" AS ENUM ('DIAS_UTEIS', 'DIAS_CORRIDOS');

-- CreateEnum
CREATE TYPE "OrigemPublicacao" AS ENUM ('AASP', 'DJEN', 'DATAJUD', 'MANUAL');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "StatusLancamento" AS ENUM ('ABERTO', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoHonorario" AS ENUM ('FIXO', 'EXITO', 'MENSAL', 'MISTO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "oab" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "tipo" "TipoPessoa" NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "rg" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Processo" (
    "id" TEXT NOT NULL,
    "numeroCnj" TEXT,
    "titulo" TEXT NOT NULL,
    "area" "AreaDireito" NOT NULL,
    "status" "StatusProcesso" NOT NULL DEFAULT 'ATIVO',
    "tribunal" TEXT,
    "vara" TEXT,
    "comarca" TEXT,
    "parteContraria" TEXT,
    "valorCausa" DECIMAL(14,2),
    "dataDistribuicao" TIMESTAMP(3),
    "consultivo" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "responsavelId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessoCliente" (
    "processoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "polo" TEXT,

    CONSTRAINT "ProcessoCliente_pkey" PRIMARY KEY ("processoId","clienteId")
);

-- CreateTable
CREATE TABLE "Andamento" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "origem" "OrigemPublicacao" NOT NULL DEFAULT 'MANUAL',
    "codigoExterno" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Andamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compromisso" (
    "id" TEXT NOT NULL,
    "tipo" "TipoCompromisso" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "dataPublicacao" TIMESTAMP(3),
    "diasPrazo" INTEGER,
    "contagem" "ContagemPrazo",
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusCompromisso" NOT NULL DEFAULT 'PENDENTE',
    "local" TEXT,
    "processoId" TEXT,
    "responsavelId" TEXT NOT NULL,
    "publicacaoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compromisso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "descricao" TEXT NOT NULL,
    "tribunal" TEXT,

    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publicacao" (
    "id" TEXT NOT NULL,
    "origem" "OrigemPublicacao" NOT NULL,
    "idExterno" TEXT,
    "dataDisponibilizacao" TIMESTAMP(3) NOT NULL,
    "dataPublicacao" TIMESTAMP(3),
    "diario" TEXT,
    "numeroProcesso" TEXT,
    "texto" TEXT NOT NULL,
    "tratada" BOOLEAN NOT NULL DEFAULT false,
    "processoId" TEXT,
    "responsavelId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Publicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atendimento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "nomeContato" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "assunto" TEXT NOT NULL,
    "relato" TEXT,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoHonorario" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "processoId" TEXT,
    "tipo" "TipoHonorario" NOT NULL,
    "valorFixo" DECIMAL(14,2),
    "percentualExito" DECIMAL(5,2),
    "descricao" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContratoHonorario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "pagamento" TIMESTAMP(3),
    "status" "StatusLancamento" NOT NULL DEFAULT 'ABERTO',
    "categoria" TEXT,
    "reembolsavel" BOOLEAN NOT NULL DEFAULT false,
    "clienteId" TEXT,
    "processoId" TEXT,
    "contratoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "clienteId" TEXT,
    "processoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroAuditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "detalhes" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cpfCnpj_key" ON "Cliente"("cpfCnpj");

-- CreateIndex
CREATE INDEX "Cliente_nome_idx" ON "Cliente"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Processo_numeroCnj_key" ON "Processo"("numeroCnj");

-- CreateIndex
CREATE INDEX "Processo_responsavelId_idx" ON "Processo"("responsavelId");

-- CreateIndex
CREATE INDEX "Andamento_processoId_data_idx" ON "Andamento"("processoId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "Andamento_processoId_origem_codigoExterno_data_key" ON "Andamento"("processoId", "origem", "codigoExterno", "data");

-- CreateIndex
CREATE UNIQUE INDEX "Compromisso_publicacaoId_key" ON "Compromisso"("publicacaoId");

-- CreateIndex
CREATE INDEX "Compromisso_responsavelId_inicio_idx" ON "Compromisso"("responsavelId", "inicio");

-- CreateIndex
CREATE UNIQUE INDEX "Feriado_data_tribunal_key" ON "Feriado"("data", "tribunal");

-- CreateIndex
CREATE INDEX "Publicacao_tratada_dataDisponibilizacao_idx" ON "Publicacao"("tratada", "dataDisponibilizacao");

-- CreateIndex
CREATE UNIQUE INDEX "Publicacao_origem_idExterno_key" ON "Publicacao"("origem", "idExterno");

-- CreateIndex
CREATE INDEX "Lancamento_status_vencimento_idx" ON "Lancamento"("status", "vencimento");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_entidade_entidadeId_idx" ON "RegistroAuditoria"("entidade", "entidadeId");

-- AddForeignKey
ALTER TABLE "Processo" ADD CONSTRAINT "Processo_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoCliente" ADD CONSTRAINT "ProcessoCliente_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoCliente" ADD CONSTRAINT "ProcessoCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Andamento" ADD CONSTRAINT "Andamento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compromisso" ADD CONSTRAINT "Compromisso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compromisso" ADD CONSTRAINT "Compromisso_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compromisso" ADD CONSTRAINT "Compromisso_publicacaoId_fkey" FOREIGN KEY ("publicacaoId") REFERENCES "Publicacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publicacao" ADD CONSTRAINT "Publicacao_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publicacao" ADD CONSTRAINT "Publicacao_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoHonorario" ADD CONSTRAINT "ContratoHonorario_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoHonorario" ADD CONSTRAINT "ContratoHonorario_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "ContratoHonorario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAuditoria" ADD CONSTRAINT "RegistroAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
