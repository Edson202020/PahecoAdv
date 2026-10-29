-- CreateEnum
CREATE TYPE "TipoCaso" AS ENUM ('PROCESSO', 'CASO', 'ATENDIMENTO', 'INCIDENTE', 'RECURSO');

-- AlterEnum
ALTER TYPE "OrigemPublicacao" ADD VALUE 'IMPORTACAO';

-- AlterTable
ALTER TABLE "Andamento" ADD COLUMN     "tipo" TEXT;

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "apelido" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "codigoAstrea" TEXT,
ADD COLUMN     "dadosExtras" JSONB,
ADD COLUMN     "dataNascimento" DATE,
ADD COLUMN     "ehCliente" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "estadoCivil" TEXT,
ADD COLUMN     "nacionalidade" TEXT,
ADD COLUMN     "nomeMae" TEXT,
ADD COLUMN     "nomePai" TEXT,
ADD COLUMN     "profissao" TEXT,
ADD COLUMN     "uf" TEXT;

-- AlterTable
ALTER TABLE "Compromisso" ADD COLUMN     "codigoAstrea" TEXT,
ADD COLUMN     "concluidoEm" TIMESTAMP(3),
ADD COLUMN     "prioridade" TEXT;

-- AlterTable
ALTER TABLE "Processo" ADD COLUMN     "codigoAstrea" TEXT,
ADD COLUMN     "dataEncerramento" TIMESTAMP(3),
ADD COLUMN     "instancia" INTEGER,
ADD COLUMN     "numeroAlternativo" TEXT,
ADD COLUMN     "pasta" TEXT,
ADD COLUMN     "tipo" "TipoCaso" NOT NULL DEFAULT 'PROCESSO',
ADD COLUMN     "tipoAcao" TEXT,
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "ProcessoCliente" ADD COLUMN     "ehCliente" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "principal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Publicacao" ADD COLUMN     "descartada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orgao" TEXT,
ADD COLUMN     "vara" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "codigoAstrea" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_codigoAstrea_key" ON "Cliente"("codigoAstrea");

-- CreateIndex
CREATE UNIQUE INDEX "Compromisso_codigoAstrea_key" ON "Compromisso"("codigoAstrea");

-- CreateIndex
CREATE UNIQUE INDEX "Processo_codigoAstrea_key" ON "Processo"("codigoAstrea");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_codigoAstrea_key" ON "Usuario"("codigoAstrea");

