import { describe, expect, it } from "vitest";
import { areaProvavel, dataAstrea, dataHoraAstrea, extrairCnj, tribunalDoCnj } from "./astrea";

describe("datas do Astrea", () => {
  it("lê os três formatos", () => {
    expect(dataAstrea("15/03/2022")?.toISOString()).toBe("2022-03-15T00:00:00.000Z");
    expect(dataAstrea("15/03/2022 09:00")?.toISOString()).toBe("2022-03-15T00:00:00.000Z");
    expect(dataAstrea("2022-03-15")?.toISOString()).toBe("2022-03-15T00:00:00.000Z");
  });
  it("ignora datas de preenchimento como 31/12/9999", () => expect(dataAstrea("31/12/9999 00:00")).toBeNull());
  it("aplica horário de Brasília", () => {
    expect(dataHoraAstrea("2023-07-04", "14:20")?.toISOString()).toBe("2023-07-04T17:20:00.000Z");
    expect(dataHoraAstrea("01/02/2023 06:00")?.toISOString()).toBe("2023-02-01T09:00:00.000Z");
  });
});

describe("tribunal e área", () => {
  it("identifica o tribunal pelo número", () => {
    expect(tribunalDoCnj("0000073-28.2022.8.26.0704")).toBe("TJSP");
    expect(tribunalDoCnj("1000123-88.2026.5.02.0001")).toBe("TRT2");
    expect(tribunalDoCnj("1000123-88.2026.5.00.0001")).toBe("TST");
    expect(tribunalDoCnj(null)).toBeNull();
  });
  it("deduz a área", () => {
    expect(areaProvavel("1000123-88.2026.5.02.0001", "", "")).toBe("TRABALHISTA");
    expect(areaProvavel(null, "2ª Vara da Família e Sucessões", "")).toBe("FAMILIA_SUCESSOES");
    expect(areaProvavel(null, "", "")).toBe("CIVEL");
  });
  it("acha o número CNJ dentro do texto", () => {
    expect(extrairCnj("Processo 0000073-28.2022.8.26.0704 - intimação")).toBe("0000073-28.2022.8.26.0704");
  });
});
