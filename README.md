# Sistema de gestão · Pachecos Advogados Associados

Sistema interno do escritório para processos, prazos, clientes, publicações, financeiro e documentos.
A especificação completa está no documento "Especificação do Sistema de Gestão Jurídica".

## O que já funciona

- Login com perfis (sócio, advogado, estagiário, secretaria) e registro de auditoria
- Clientes (validação de CPF e CNPJ)
- Processos e casos consultivos (validação do número CNJ), clientes vinculados e andamentos
- Agenda: prazos, audiências, reuniões e tarefas, com atrasados, hoje e próximos
- Cálculo de prazos em dias úteis ou corridos, com feriados cadastrados e recesso de 20/12 a 20/01;
  todo prazo fica "aguardando confirmação" até um advogado conferir
- Painel inicial por usuário
- Cadastro de usuários e de feriados (somente sócio)
- Instalável no celular (manifesto web)

- Publicações (caixa de entrada) e andamentos automáticos pelo DataJud
- Financeiro: resumo, saldo por conta, lançamentos a receber e a pagar, faturas e honorários por processo

Atendimentos e documentos têm tabelas no banco; as telas chegam na próxima etapa.

## Tecnologia

Next.js 15 (React 19), TypeScript, Tailwind CSS, PostgreSQL com Prisma, NextAuth.

## Como rodar localmente

```bash
cp .env.example .env            # ajuste DATABASE_URL e gere NEXTAUTH_SECRET
npm install
npx prisma migrate deploy
ADMIN_NOME="Seu nome" ADMIN_EMAIL="voce@escritorio.com.br" ADMIN_SENHA="uma-senha-forte" npm run seed
npm run dev                     # http://localhost:3000
```

O `seed` cria o primeiro usuário sócio e os feriados nacionais fixos do ano atual e do próximo.
Carnaval, Corpus Christi, feriados municipais e suspensões de cada tribunal devem ser cadastrados na tela Feriados.

## Publicações e andamentos automáticos

- Tela **Publicações**: caixa de entrada (pendentes, tratadas, descartadas), vínculo ao processo pelo número CNJ,
  distribuição ao responsável e botão "Criar prazo", que abre o cálculo já com a data de disponibilização.
- **DataJud (CNJ)**: `npm run sincronizar:datajud` busca novos movimentos de todos os processos ativos com número CNJ
  e grava como andamentos. Exige `DATAJUD_API_KEY`. Na hospedagem, um agendador chama `POST /api/cron/datajud`
  com o cabeçalho `Authorization: Bearer <CRON_SECRET>`.
- **AASP**: a integração depende da documentação técnica da API de intimações, que a AASP fornece ao associado.

## Importar o backup do Astrea

Descompacte o arquivo `BACKUP_TOTAL_....zip` exportado do Astrea numa pasta **fora do repositório**
(os dados dos clientes nunca devem ir para o Git) e rode:

```bash
npm run importar:astrea -- /caminho/da/pasta
```

Importa usuários, contatos (clientes e demais partes), processos e casos, prazos, audiências, eventos,
tarefas, publicações, históricos e financeiro. Pode ser executado de novo sem duplicar nada.
Usuários importados recebem senha aleatória: o sócio define a senha de cada um na tela Usuários.
Também importa o financeiro (contas, categorias, faturas, lançamentos e honorários). Documentos e timesheets ainda não.

## Testes

```bash
npm test
```
