"use client";

import { useEffect, useState } from "react";
import { Formulario } from "@/components/Formulario";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { TIPOS_COMPROMISSO } from "@/lib/rotulos";
import { criarCompromisso, simularPrazo } from "./acoes";

type Opcao = { id: string; nome: string };
type Simulacao = { publicacao: string; inicio: string; vencimento: string } | null;

const br = (iso: string) => iso.split("-").reverse().join("/");

export function FormCompromisso({
  processos,
  responsaveis,
  processoInicial,
  responsavelInicial,
  podeConfirmar,
  publicacaoId,
  disponibilizacaoInicial = "",
}: {
  processos: { id: string; titulo: string; numeroCnj: string | null }[];
  responsaveis: Opcao[];
  processoInicial: string;
  responsavelInicial: string;
  podeConfirmar: boolean;
  publicacaoId?: string;
  disponibilizacaoInicial?: string;
}) {
  const [tipo, setTipo] = useState("PRAZO");
  const [processoId, setProcessoId] = useState(processoInicial);
  const [disponibilizacao, setDisponibilizacao] = useState(disponibilizacaoInicial);
  const [dias, setDias] = useState(15);
  const [contagem, setContagem] = useState<"DIAS_UTEIS" | "DIAS_CORRIDOS">("DIAS_UTEIS");
  const [simulacao, setSimulacao] = useState<Simulacao>(null);

  useEffect(() => {
    if (tipo !== "PRAZO" || !disponibilizacao || dias < 1) {
      setSimulacao(null);
      return;
    }
    let ativo = true;
    simularPrazo({ disponibilizacao, dias, contagem, processoId: processoId || null }).then((r) => ativo && setSimulacao(r));
    return () => {
      ativo = false;
    };
  }, [tipo, disponibilizacao, dias, contagem, processoId]);

  return (
    <Formulario acao={criarCompromisso} className="cartao space-y-4">
      {publicacaoId && <input type="hidden" name="publicacaoId" value={publicacaoId} />}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="rotulo" htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="campo">
            {Object.entries(TIPOS_COMPROMISSO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="titulo">Título</label>
          <input id="titulo" name="titulo" required placeholder={tipo === "PRAZO" ? "Ex.: Contestação" : "Ex.: Audiência de instrução"} className="campo" />
        </div>
        <div>
          <label className="rotulo" htmlFor="processoId">Processo</label>
          <select id="processoId" name="processoId" value={processoId} onChange={(e) => setProcessoId(e.target.value)} className="campo">
            <option value="">Sem processo</option>
            {processos.map((p) => <option key={p.id} value={p.id}>{p.titulo}{p.numeroCnj ? ` (${p.numeroCnj})` : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="responsavelId">Responsável</label>
          <select id="responsavelId" name="responsavelId" defaultValue={responsavelInicial} className="campo">
            {responsaveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </div>

        {tipo === "PRAZO" ? (
          <>
            <div>
              <label className="rotulo" htmlFor="disponibilizacao">Data de disponibilização no diário</label>
              <input id="disponibilizacao" name="disponibilizacao" type="date" required value={disponibilizacao} onChange={(e) => setDisponibilizacao(e.target.value)} className="campo" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="rotulo" htmlFor="dias">Dias</label>
                <input id="dias" name="dias" type="number" min={1} required value={dias} onChange={(e) => setDias(Number(e.target.value))} className="campo" />
              </div>
              <div>
                <label className="rotulo" htmlFor="contagem">Contagem</label>
                <select id="contagem" name="contagem" value={contagem} onChange={(e) => setContagem(e.target.value as typeof contagem)} className="campo">
                  <option value="DIAS_UTEIS">Dias úteis</option>
                  <option value="DIAS_CORRIDOS">Dias corridos</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2 rounded-md bg-marca-50 p-3 text-sm">
              {simulacao ? (
                <>
                  <p>Publicação: <strong>{br(simulacao.publicacao)}</strong> · Início da contagem: <strong>{br(simulacao.inicio)}</strong></p>
                  <p>Vencimento calculado: <strong>{br(simulacao.vencimento)}</strong></p>
                  <p className="mt-1 text-xs text-slate-600">Cálculo com feriados cadastrados e recesso de 20/12 a 20/01. Confira antes de confirmar.</p>
                </>
              ) : (
                <p className="text-slate-600">Informe a disponibilização e os dias para ver o vencimento.</p>
              )}
            </div>
            <div>
              <label className="rotulo" htmlFor="vencimento">Ajustar vencimento (opcional)</label>
              <input id="vencimento" name="vencimento" type="date" className="campo" />
            </div>
            {podeConfirmar && (
              <label className="flex items-center gap-2 self-end text-sm">
                <input type="checkbox" name="confirmar" value="1" /> Conferi e confirmo o vencimento
              </label>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="rotulo" htmlFor="inicio">Data e horário</label>
              <input id="inicio" name="inicio" type="datetime-local" required className="campo" />
            </div>
            <div>
              <label className="rotulo" htmlFor="local">Local ou link</label>
              <input id="local" name="local" className="campo" />
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <label className="rotulo" htmlFor="descricao">Observações</label>
          <textarea id="descricao" name="descricao" rows={2} className="campo" />
        </div>
      </div>
      <BotaoEnviar>Salvar</BotaoEnviar>
    </Formulario>
  );
}
