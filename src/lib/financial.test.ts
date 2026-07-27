import { describe, expect, it } from "vitest";
import {
  computeEntryPaymentStatus,
  computeFinancialTotals,
  computeRemainingAmount,
  resolvePaidAmount,
} from "./financial";

describe("computeEntryPaymentStatus", () => {
  it("is pendente when nothing was paid", () => {
    expect(computeEntryPaymentStatus(100, 0)).toBe("pendente");
  });

  it("is parcial when part of the amount was paid", () => {
    expect(computeEntryPaymentStatus(100, 40)).toBe("parcial");
  });

  it("is pago when the full amount was paid", () => {
    expect(computeEntryPaymentStatus(100, 100)).toBe("pago");
  });

  it("treats an overpayment (rounding) as pago", () => {
    expect(computeEntryPaymentStatus(100, 100.01)).toBe("pago");
  });
});

describe("computeRemainingAmount", () => {
  it("returns the difference when partially paid", () => {
    expect(computeRemainingAmount(100, 40)).toBe(60);
  });

  it("never goes negative when paid exceeds the amount", () => {
    expect(computeRemainingAmount(100, 150)).toBe(0);
  });

  it("returns the full amount when nothing was paid", () => {
    expect(computeRemainingAmount(100, 0)).toBe(100);
  });
});

describe("resolvePaidAmount", () => {
  it("forces the full amount for pago", () => {
    expect(resolvePaidAmount("pago", 100, 0)).toBe(100);
  });

  it("forces zero for pendente", () => {
    expect(resolvePaidAmount("pendente", 100, 999)).toBe(0);
  });

  it("uses the informed partial amount for parcial", () => {
    expect(resolvePaidAmount("parcial", 100, 40)).toBe(40);
  });

  it("rejects a partial amount that is zero or negative", () => {
    expect(() => resolvePaidAmount("parcial", 100, 0)).toThrow();
    expect(() => resolvePaidAmount("parcial", 100, -10)).toThrow();
  });

  it("rejects a partial amount greater than or equal to the total", () => {
    expect(() => resolvePaidAmount("parcial", 100, 100)).toThrow();
    expect(() => resolvePaidAmount("parcial", 100, 150)).toThrow();
  });
});

describe("computeFinancialTotals", () => {
  it("sums only what was actually paid for receitas and despesas", () => {
    const totals = computeFinancialTotals([
      { type: "receita", amount: 100, paid_amount: 100 },
      { type: "receita", amount: 200, paid_amount: 50 },
      { type: "despesa", amount: 80, paid_amount: 80 },
    ]);
    expect(totals).toEqual({ receitas: 150, despesas: 80, saldo: 70, pendencias: 150 });
  });

  it("includes extra paid/pending amounts (e.g. arbitragem) outside the entries list", () => {
    const totals = computeFinancialTotals(
      [{ type: "receita", amount: 100, paid_amount: 100 }],
      30,
      20
    );
    expect(totals).toEqual({ receitas: 100, despesas: 30, saldo: 70, pendencias: 20 });
  });

  it("returns zeroed totals for an empty list with no extras", () => {
    expect(computeFinancialTotals([])).toEqual({
      receitas: 0,
      despesas: 0,
      saldo: 0,
      pendencias: 0,
    });
  });
});
