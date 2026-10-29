-- CreateTable
CREATE TABLE "ModeloDocumento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "conteudo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModeloDocumento_nome_key" ON "ModeloDocumento"("nome");

