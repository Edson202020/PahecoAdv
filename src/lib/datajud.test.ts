import { describe, expect, it } from "vitest";
import { aliasDataJud, descreverMovimento } from "./datajud";

describe("DataJud", () => {
  it("monta o alias do tribunal", () => {
    expect(aliasDataJud("TJSP")).toBe("api_publica_tjsp");
    expect(aliasDataJud("TRT2")).toBe("api_publica_trt2");
  });
  it("descreve o movimento com os complementos", () => {
    expect(
      descreverMovimento({ nome: "Conclusão", complementosTabelados: [{ nome: "para despacho", descricao: "tipo_de_conclusao" }] }),
    ).toBe("Conclusão\ntipo_de_conclusao: para despacho");
  });
});
