"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runAction, type ActionResult } from "@/lib/action-result";
import { PLAYER_POSITIONS } from "@/lib/positions";

export async function createRacha(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // redirect() lança um erro especial que o Next intercepta pra navegar —
  // não pode ficar dentro do try/catch do runAction (seria engolido).
  if (!user) redirect("/login");

  const result = await runAction(async () => {
    const name = String(formData.get("name") || "").trim();
    if (!name) throw new Error("Informe o nome do racha.");

    const monthlyPrice = Number(formData.get("monthly_price") || 0);
    const dailyPrice = Number(formData.get("daily_price") || 0);
    if (!Number.isFinite(monthlyPrice) || monthlyPrice < 0) {
      throw new Error("Informe um valor mensal válido.");
    }
    if (!Number.isFinite(dailyPrice) || dailyPrice < 0) {
      throw new Error("Informe um valor diário válido.");
    }

    const { data: championship, error } = await supabase
      .from("championships")
      .insert({ name, owner_id: user.id, kind: "racha", format: "liga" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: settingsError } = await supabase.from("racha_settings").insert({
      championship_id: championship.id,
      monthly_price: monthlyPrice,
      daily_price: dailyPrice,
    });
    if (settingsError) throw new Error(settingsError.message);

    const { error: teamsError } = await supabase.from("teams").insert([
      { championship_id: championship.id, name: "Time A" },
      { championship_id: championship.id, name: "Time B" },
    ]);
    if (teamsError) throw new Error(teamsError.message);

    return championship.id;
  });

  if (!result.ok) return result;
  redirect(`/racha/${result.data}`);
}

export async function joinRacha(championshipId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Você precisa entrar na sua conta para jogar.");

    const position = String(formData.get("position") || "");
    if (!PLAYER_POSITIONS.includes(position as (typeof PLAYER_POSITIONS)[number])) {
      throw new Error("Selecione uma posição.");
    }
    const paymentPlan = String(formData.get("payment_plan") || "");
    if (paymentPlan !== "mensal" && paymentPlan !== "diaria") {
      throw new Error("Selecione o plano de pagamento.");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle();
    const name =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      user.email ||
      "Jogador";

    const { error } = await supabase.from("players").insert({
      championship_id: championshipId,
      user_id: user.id,
      name,
      position,
      payment_plan: paymentPlan,
    });
    if (error) throw new Error(error.message);

    revalidatePath(`/racha/${championshipId}`);
  });
}

export async function confirmRachaAttendance(
  championshipId: string,
  sessionId: string,
  confirmed: boolean
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("racha_confirm_attendance", {
      p_session_id: sessionId,
      p_confirmed: confirmed,
    });
    if (error) throw new Error(error.message);
    revalidatePath(`/racha/${championshipId}`);
  });
}
