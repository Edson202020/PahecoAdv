import { describe, expect, it } from "vitest";
import { normalizarCnj, validarCnpj, validarCpf } from "./formatos";

// Gera um número CNJ válido para teste a partir dos campos, calculando o dígito.
function cnjValido(n: string, ano: string, j: string, tr: string, origem: string) {
  const resto = BigInt(n + ano + j + tr + origem + "00") % 97n;
  const dv = (98n - resto).toString().padStart(2, "0");
  return `${n}${dv}${ano}${j}${tr}${origem}`;
}

describe("normalizarCnj", () => {
  it("formata um número com dígito correto", () => {
    const bruto = cnjValido("1000123", "2024", "8", "26", "0100");
    expect(normalizarCnj(bruto)).toMatch(/^1000123-\d{2}\.2024\.8\.26\.0100$/);
  });
  it("rejeita dígito verificador errado", () => {
    const bruto = cnjValido("1000123", "2024", "5", "02", "0001");
    const errado = bruto.slice(0, 7) + ((Number(bruto.slice(7, 9)) + 1) % 100).toString().padStart(2, "0") + bruto.slice(9);
    expect(normalizarCnj(errado)).toBeNull();
  });
  it("rejeita tamanho errado", () => expect(normalizarCnj("123")).toBeNull());
});

describe("CPF e CNPJ", () => {
  it("valida CPF", () => {
    expect(validarCpf("529.982.247-25")).toBe(true);
    expect(validarCpf("529.982.247-24")).toBe(false);
    expect(validarCpf("111.111.111-11")).toBe(false);
  });
  it("valida CNPJ", () => {
    expect(validarCnpj("11.222.333/0001-81")).toBe(true);
    expect(validarCnpj("11.222.333/0001-80")).toBe(false);
  });
});
