import { db } from "@/lib/db";
import { exigir } from "@/lib/auth";
import { NOMES_PERFIL } from "@/lib/permissoes";
import { Formulario } from "@/components/Formulario";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { alterarPerfil, alternarAtivo, criarUsuario, redefinirSenha } from "./acoes";

export default async function PaginaUsuarios() {
  const admin = await exigir("usuarios:gerenciar");
  const usuarios = await db.usuario.findMany({ orderBy: { nome: "asc" } });

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Usuários</h1>
      <div className="cartao overflow-x-auto p-0">
        <table className="tabela">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil e OAB</th><th>Situação</th><th>Senha</th></tr></thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nome}</td>
                <td>{u.email}</td>
                <td>
                  <form action={alterarPerfil.bind(null, u.id)} className="flex flex-wrap gap-1">
                      {u.id === admin.id ? <input type="hidden" name="perfil" value={u.perfil} /> : (
                        <select name="perfil" defaultValue={u.perfil} className="campo w-auto py-1">
                          {Object.entries(NOMES_PERFIL).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                        </select>
                      )}
                      <input name="oab" defaultValue={u.oab ?? ""} placeholder="OAB (SP 000.000)" className="campo w-32 py-1" />
                      <button className="botao-secundario px-2 py-1 text-xs">Salvar</button>
                  </form>
                </td>
                <td>
                  {u.id === admin.id ? "Ativo" : (
                    <form action={alternarAtivo.bind(null, u.id)}>
                      <button className="link">{u.ativo ? "Ativo (bloquear)" : "Bloqueado (liberar)"}</button>
                    </form>
                  )}
                </td>
                <td>
                  <Formulario limparAoSalvar acao={redefinirSenha.bind(null, u.id)} className="flex gap-1">
                    <input name="senha" type="password" placeholder="Nova senha" className="campo w-36 py-1" />
                    <BotaoEnviar>Trocar</BotaoEnviar>
                  </Formulario>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Formulario limparAoSalvar acao={criarUsuario} className="cartao space-y-4">
        <h2 className="font-semibold">Novo usuário</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="rotulo" htmlFor="nome">Nome</label><input id="nome" name="nome" required className="campo" /></div>
          <div><label className="rotulo" htmlFor="email">E-mail</label><input id="email" name="email" type="email" required className="campo" /></div>
          <div>
            <label className="rotulo" htmlFor="perfil">Perfil</label>
            <select id="perfil" name="perfil" className="campo" defaultValue="ADVOGADO">
              {Object.entries(NOMES_PERFIL).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </div>
          <div><label className="rotulo" htmlFor="oab">OAB (se advogado)</label><input id="oab" name="oab" placeholder="SP 000.000" className="campo" /></div>
          <div><label className="rotulo" htmlFor="senha">Senha inicial (mín. 10 caracteres)</label><input id="senha" name="senha" type="password" required className="campo" /></div>
        </div>
        <BotaoEnviar>Cadastrar usuário</BotaoEnviar>
      </Formulario>
    </div>
  );
}
