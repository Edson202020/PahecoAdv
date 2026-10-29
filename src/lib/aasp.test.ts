import { describe, expect, it } from "vitest";
import { converterIntimacao, urlIntimacoes } from "./aasp";

describe("AASP", () => {
  it("monta a consulta do dia com a data no padrão brasileiro", () => {
    const url = new URL(urlIntimacoes("CHAVE", new Date("2026-10-29T12:00:00Z")));
    expect(url.pathname).toBe("/api/Associado/intimacao/json");
    expect(url.searchParams.get("data")).toBe("29/10/2026");
    expect(url.searchParams.get("chave")).toBe("CHAVE");
  });
  it("lê os campos com nomes variados e acha o número CNJ no texto", () => {
    const pub = converterIntimacao(
      { Jornal: "DJE SP", DataDisponibilizacao: "28/10/2026", Texto: "Processo 1139702-32.2023.8.26.0100 intime-se" },
      new Date(),
    );
    expect(pub.diario).toBe("DJE SP");
    expect(pub.dataDisponibilizacao.toISOString().slice(0, 10)).toBe("2026-10-28");
    expect(pub.numeroProcesso).toBe("1139702-32.2023.8.26.0100");
  });
  it("guarda o conteúdo bruto quando não reconhece o campo de texto", () => {
    expect(converterIntimacao({ foo: "bar" }, new Date()).texto).toBe("foo: bar");
  });
});
