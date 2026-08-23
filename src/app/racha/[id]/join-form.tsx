"use client";

import { Label, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { PLAYER_POSITIONS } from "@/lib/positions";
import { joinRacha } from "../actions";

export function JoinRachaForm({ championshipId }: { championshipId: string }) {
  return (
    <ActionForm
      action={joinRacha.bind(null, championshipId)}
      className="flex flex-wrap items-end gap-3"
      successMessage="Você entrou no racha!"
    >
      <div className="w-40">
        <Label>Posição</Label>
        <Select name="position" required defaultValue="">
          <option value="" disabled>
            Selecione
          </option>
          {PLAYER_POSITIONS.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-40">
        <Label>Plano de pagamento</Label>
        <Select name="payment_plan" required defaultValue="">
          <option value="" disabled>
            Selecione
          </option>
          <option value="mensal">Mensal</option>
          <option value="diaria">Diária</option>
        </Select>
      </div>
      <SubmitButton pendingText="Entrando…">Quero jogar</SubmitButton>
    </ActionForm>
  );
}
