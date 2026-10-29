import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { corpoXml, dataPorExtenso, gerarDocx, preencher, trechos } from "./documentos";

describe("modelos de documento", () => {
  it("preenche campos e marca os que faltam", () => {
    expect(preencher("Eu, {{cliente.nome}}, CPF {{cliente.cpfCnpj}}", { "cliente.nome": "Maria" })).toBe(
      "Eu, Maria, CPF [PREENCHER: cliente.cpfCnpj]",
    );
  });
  it("reconhece negrito, sublinhado e pendências", () => {
    expect(trechos("a **b** __c__ [PREENCHER: x]")).toEqual([
      { texto: "a ", negrito: false },
      { texto: "b", negrito: true },
      { texto: " ", negrito: false },
      { texto: "c", sublinhado: true, negrito: false },
      { texto: " ", negrito: false },
      { texto: "[PREENCHER: x]", pendente: true },
    ]);
  });
  it("escapa caracteres especiais do XML", () => {
    expect(corpoXml("A & B <C>")).toContain("A &amp; B &lt;C&gt;");
  });
  it("escreve a data por extenso", () => {
    expect(dataPorExtenso(new Date("2026-10-29T15:00:00Z"))).toBe("29 de outubro de 2026");
  });
  it("gera um .docx com o timbrado e o texto", async () => {
    const buf = await gerarDocx("# PROCURAÇÃO\nOutorgante: **{{cliente.nome}}**", { "cliente.nome": "Maria da Silva" });
    const zip = await JSZip.loadAsync(buf);
    const doc = await zip.file("word/document.xml")!.async("string");
    expect(doc).toContain("PROCURAÇÃO");
    expect(doc).toContain("Maria da Silva");
    expect(doc).not.toContain("{{CORPO}}");
    expect(doc).toContain("w:headerReference");
    expect(zip.file("word/media/image1.png")).not.toBeNull();
  });
});

describe("linha de assinatura", () => {
  it("mantém sequência de sublinhados como texto", () => {
    expect(trechos("____________")).toEqual([{ texto: "____________", negrito: false }]);
    expect(trechos("__ad judicia__")[0]).toMatchObject({ texto: "ad judicia", sublinhado: true });
  });
});
