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

O banco já tem as tabelas de publicações, atendimentos, financeiro e documentos; as telas chegam nas próximas etapas.

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

## Testes

```bash
npm test
```
