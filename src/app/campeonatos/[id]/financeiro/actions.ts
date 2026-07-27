"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { runAction, type ActionResult } from "@/lib/action-result";
import { resolvePaidAmount, type FinancialPaymentStatus } from "@/lib/financial";

function parseEntry(formData: FormData) {
  const type = String(formData.get("type") || "");
  if (type !== "receita" && type !== "despesa") {
    throw new Error("Selecione o tipo (receita ou despesa).");
  }
  const category = String(formData.get("category") || "").trim();
  if (!category) throw new Error("Selecione a categoria.");

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Informe um valor válido.");
  }

  const description = String(formData.get("description") || "").trim();
  const teamId = String(formData.get("team_id") || "").trim();
  const entryDate = String(formData.get("entry_date") || "").trim();

  const paymentStatus = String(formData.get("payment_status") || "") as FinancialPaymentStatus;
  if (!["pago", "parcial", "pendente"].includes(paymentStatus)) {
    throw new Error("Selecione o status do pagamento.");
  }
  const partialAmount = Number(formData.get("partial_amount"));
  const paidAmount = resolvePaidAmount(paymentStatus, amount, partialAmount);

  return {
    type,
    category,
    amount,
    description: description || null,
    team_id: teamId || null,
    entry_date: entryDate || undefined,
    paid_amount: paidAmount,
  };
}

export async function createFinancialEntry(
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const entry = parseEntry(formData);
    const supabase = await createClient();
    const { error } = await supabase.from("financial_entries").insert({
      championship_id: championshipId,
      ...entry,
    });
    if (error) throw new Error(error.message);
    revalidateChampionship(championshipId);
  });
}

export async function updateFinancialEntry(
  id: string,
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const entry = parseEntry(formData);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("financial_entries")
      .update(entry)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Lançamento não encontrado ou sem permissão para editar.");
    revalidateChampionship(championshipId);
  });
}

export async function deleteFinancialEntry(
  id: string,
  championshipId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("financial_entries").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidateChampionship(championshipId);
  });
}
