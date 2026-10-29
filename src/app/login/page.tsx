"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MensagemErro } from "@/components/Erro";

function FormLogin() {
  const router = useRouter();
  const destino = useSearchParams().get("callbackUrl") ?? "/";
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  // onSubmit (e não action) para o formulário não ser limpo após uma senha errada.
  async function entrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    setEnviando(true);
    setErro(undefined);
    const r = await signIn("credentials", {
      email: dados.get("email"),
      senha: dados.get("senha"),
      redirect: false,
    });
    setEnviando(false);
    if (r?.ok) router.replace(destino);
    else setErro("E-mail ou senha incorretos.");
  }

  return (
    <form onSubmit={entrar} className="cartao w-full max-w-sm space-y-4 p-6">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Pachecos Advogados" width={590} height={271} className="mx-auto mb-2 w-56" />
        <h1 className="sr-only">Pachecos Advogados</h1>
        <p className="text-center text-sm text-slate-500">Acesse o sistema de gestão</p>
      </div>
      <MensagemErro mensagem={erro} />
      <div>
        <label className="rotulo" htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" required autoComplete="current-password" className="campo" />
      </div>
      <button className="botao w-full" disabled={enviando}>{enviando ? "Entrando..." : "Entrar"}</button>
    </form>
  );
}

export default function PaginaLogin() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense>
        <FormLogin />
      </Suspense>
    </main>
  );
}
