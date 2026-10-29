"use client";

import { startTransition, useActionState, useRef } from "react";
import { MensagemErro } from "./Erro";

export type EstadoForm = { erro?: string };
type Acao = (estado: EstadoForm, dados: FormData) => Promise<EstadoForm>;

/** Formulário que mostra o erro devolvido pela ação do servidor. */
export function Formulario({
  acao,
  children,
  className = "space-y-4",
  limparAoSalvar = false,
}: {
  acao: Acao;
  children: React.ReactNode;
  className?: string;
  limparAoSalvar?: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [estado, executar, pendente] = useActionState(async (anterior: EstadoForm, dados: FormData) => {
    const r = await acao(anterior, dados);
    if (!r.erro && limparAoSalvar) ref.current?.reset();
    return r;
  }, {});

  // Envio por onSubmit: o React só limpa os campos de forms com `action`,
  // assim o que foi digitado não se perde quando a validação falha.
  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    startTransition(() => executar(dados));
  }

  return (
    <form ref={ref} onSubmit={enviar} className={className} aria-busy={pendente}>
      <MensagemErro mensagem={estado.erro} />
      <fieldset disabled={pendente} className="contents">{children}</fieldset>
    </form>
  );
}
