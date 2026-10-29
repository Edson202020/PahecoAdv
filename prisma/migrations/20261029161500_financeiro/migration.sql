-- CreateEnum
CREATE TYPE "StatusHonorario" AS ENUM ('LANCADO', 'FATURADO', 'PARCIAL', 'RECEBIDO');

-- CreateEnum
CREATE TYPE "StatusFatura" AS ENUM ('ABERTA', 'PAGA', 'CANCELADA');


-- DropForeignKey
ALTER TABLE "ContratoHonorario" DROP CONSTRAINT "ContratoHonorario_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "ContratoHonorario" DROP CONSTRAINT "ContratoHonorario_processoId_fkey";

-- DropForeignKey
ALTER TABLE "Lancamento" DROP CONSTRAINT "Lancamento_contratoId_fkey";

-- AlterTable
ALTER TABLE "Lancamento" DROP COLUMN "categoria",
DROP COLUMN "contratoId",
ADD COLUMN     "categoriaId" TEXT,
ADD COLUMN     "centroCusto" TEXT,
ADD COLUMN     "codigoAstrea" TEXT,
ADD COLUMN     "contaId" TEXT,
ADD COLUMN     "faturaId" TEXT,
ADD COLUMN     "statusReembolso" TEXT,
ADD COLUMN     "subtipo" TEXT,
ALTER COLUMN "vencimento" SET DATA TYPE DATE,
ALTER COLUMN "pagamento" SET DATA TYPE DATE;

-- DropTable
DROP TABLE "ContratoHonorario";

-- Recria o tipo de honorário (a tabela antiga não tinha dados)
DROP TYPE "TipoHonorario";
CREATE TYPE "TipoHonorario" AS ENUM ('VALOR', 'PERCENTUAL');

-- CreateTable
CREATE TABLE "ContaBancaria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "agencia" TEXT,
    "conta" TEXT,
    "saldoInicial" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "inicio" DATE NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "codigoAstrea" TEXT,

    CONSTRAINT "ContaBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaFinanceira" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "paiId" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "codigoAstrea" TEXT,

    CONSTRAINT "CategoriaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Honorario" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoHonorario" NOT NULL,
    "valor" DECIMAL(14,2),
    "percentual" DECIMAL(5,2),
    "vencimento" DATE,
    "status" "StatusHonorario" NOT NULL DEFAULT 'LANCADO',
    "processoId" TEXT,
    "lancamentoId" TEXT,
    "codigoAstrea" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Honorario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fatura" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" TEXT,
    "status" "StatusFatura" NOT NULL DEFAULT 'ABERTA',
    "emissao" DATE NOT NULL,
    "vencimento" DATE NOT NULL,
    "pagamento" DATE,
    "valor" DECIMAL(14,2) NOT NULL,
    "valorDespesas" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "contaId" TEXT,
    "observacoes" TEXT,
    "codigoAstrea" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fatura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContaBancaria_codigoAstrea_key" ON "ContaBancaria"("codigoAstrea");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaFinanceira_codigoAstrea_key" ON "CategoriaFinanceira"("codigoAstrea");

-- CreateIndex
CREATE UNIQUE INDEX "Honorario_codigoAstrea_key" ON "Honorario"("codigoAstrea");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_codigoAstrea_key" ON "Fatura"("codigoAstrea");

-- CreateIndex
CREATE UNIQUE INDEX "Lancamento_codigoAstrea_key" ON "Lancamento"("codigoAstrea");

-- AddForeignKey
ALTER TABLE "CategoriaFinanceira" ADD CONSTRAINT "CategoriaFinanceira_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "CategoriaFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Honorario" ADD CONSTRAINT "Honorario_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Honorario" ADD CONSTRAINT "Honorario_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "Lancamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

