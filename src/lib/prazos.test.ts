import { describe, expect, it } from "vitest";
import { calcularPrazo, chave } from "./prazos";

const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe("calcularPrazo", () => {
  it("suspende a contagem no recesso de 20/12 a 20/01", () => {
    // Disponibilizado sexta 10/01/2025, publicado segunda 13/01.
    // Janeiro até dia 20 está em recesso, então a contagem começa em 21/01.
    const r = calcularPrazo({
      disponibilizacao: d("2025-01-10"),
      dias: 15,
      contagem: "DIAS_UTEIS",
      feriados: [],
    });
    expect(chave(r.publicacao)).toBe("2025-01-13");
    expect(chave(r.inicio)).toBe("2025-01-21");
    expect(chave(r.vencimento)).toBe("2025-02-10");
  });

  it("conta 5 dias úteis pulando fim de semana e feriado", () => {
    // Disponibilizado quinta 10/04/2025, publicado sexta 11/04.
    // Dias úteis: 14, 15, 16, 17 (18 é feriado), 22 (21 é feriado).
    const r = calcularPrazo({
      disponibilizacao: d("2025-04-10"),
      dias: 5,
      contagem: "DIAS_UTEIS",
      feriados: ["2025-04-18", "2025-04-21"],
    });
    expect(chave(r.publicacao)).toBe("2025-04-11");
    expect(chave(r.inicio)).toBe("2025-04-14");
    expect(chave(r.vencimento)).toBe("2025-04-22");
  });

  it("prorroga vencimento em dias corridos que cai no sábado", () => {
    // Publicado segunda 02/06/2025; 5 dias corridos vencem sábado 07/06, prorroga para 09/06.
    const r = calcularPrazo({
      disponibilizacao: d("2025-05-30"),
      dias: 5,
      contagem: "DIAS_CORRIDOS",
      feriados: [],
    });
    expect(chave(r.publicacao)).toBe("2025-06-02");
    expect(chave(r.vencimento)).toBe("2025-06-09");
  });

  it("rejeita prazo de zero dias", () => {
    expect(() =>
      calcularPrazo({ disponibilizacao: d("2025-03-03"), dias: 0, contagem: "DIAS_UTEIS", feriados: [] }),
    ).toThrow();
  });
});
