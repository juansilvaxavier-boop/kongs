import { describe, expect, it } from "vitest";
import { formatCpf, isValidCpf, onlyDigits } from "./cpf";

describe("isValidCpf", () => {
  it("accepts exactly 11 digits, formatted or not", () => {
    expect(isValidCpf("12345678901")).toBe(true);
    expect(isValidCpf("123.456.789-01")).toBe(true);
  });

  it("rejects anything other than 11 digits", () => {
    expect(isValidCpf("1234567890")).toBe(false);
    expect(isValidCpf("123456789012")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });
});

describe("onlyDigits", () => {
  it("strips every non-digit character", () => {
    expect(onlyDigits("123.456.789-01")).toBe("12345678901");
  });
});

describe("formatCpf", () => {
  it("formats a full CPF as XXX.XXX.XXX-XX", () => {
    expect(formatCpf("12345678901")).toBe("123.456.789-01");
  });

  it("formats a partial CPF as the user types", () => {
    expect(formatCpf("123")).toBe("123");
    expect(formatCpf("123456")).toBe("123.456");
    expect(formatCpf("123456789")).toBe("123.456.789");
  });

  it("ignores extra digits beyond 11", () => {
    expect(formatCpf("123456789012345")).toBe("123.456.789-01");
  });
});
