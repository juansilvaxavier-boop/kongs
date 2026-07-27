export type FinancialPaymentStatus = "pago" | "parcial" | "pendente";

/**
 * Status de pagamento de um lançamento a partir do valor total e do
 * valor já pago. `paidAmount` nunca passa de `amount` (validado na
 * escrita), então "pago" cobre tanto o caso exato quanto qualquer
 * arredondamento que o deixe levemente acima.
 */
export function computeEntryPaymentStatus(
  amount: number,
  paidAmount: number
): FinancialPaymentStatus {
  if (paidAmount <= 0) return "pendente";
  if (paidAmount >= amount) return "pago";
  return "parcial";
}

export function computeRemainingAmount(amount: number, paidAmount: number): number {
  return Math.max(0, amount - paidAmount);
}

/**
 * Resolve o valor pago a partir do status escolhido no formulário:
 * "pago" força o valor total (mesmo que o campo de valor parcial não
 * tenha sido preenchido), "pendente" zera, e "parcial" usa o valor
 * informado (validado para ficar estritamente entre 0 e o total).
 */
export function resolvePaidAmount(
  status: FinancialPaymentStatus,
  amount: number,
  partialAmount: number
): number {
  if (status === "pago") return amount;
  if (status === "pendente") return 0;
  if (!Number.isFinite(partialAmount) || partialAmount <= 0 || partialAmount >= amount) {
    throw new Error("Informe um valor parcial maior que zero e menor que o valor total.");
  }
  return partialAmount;
}

export type FinancialEntryForTotals = {
  type: "receita" | "despesa";
  amount: number;
  paid_amount: number;
};

export type FinancialTotals = {
  receitas: number;
  despesas: number;
  saldo: number;
  pendencias: number;
};

/**
 * Totais do painel financeiro: receitas/despesas contam só o que já foi
 * efetivamente recebido/pago (`paid_amount`), e pendências somam o que
 * falta de todo mundo (receita ou despesa, pago ou parcial).
 * `extraDespesasPagas`/`extraPendencias` entram os valores de fora da
 * tabela de lançamentos manuais (ex.: pagamento de arbitragem).
 */
export function computeFinancialTotals(
  entries: FinancialEntryForTotals[],
  extraDespesasPagas = 0,
  extraPendencias = 0
): FinancialTotals {
  let receitas = 0;
  let despesas = extraDespesasPagas;
  let pendencias = extraPendencias;

  for (const entry of entries) {
    if (entry.type === "receita") {
      receitas += entry.paid_amount;
    } else {
      despesas += entry.paid_amount;
    }
    pendencias += computeRemainingAmount(entry.amount, entry.paid_amount);
  }

  return { receitas, despesas, saldo: receitas - despesas, pendencias };
}
