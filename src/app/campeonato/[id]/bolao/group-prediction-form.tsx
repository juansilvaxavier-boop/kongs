"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Label, Select } from "@/components/ui";
import type { ActionResult } from "@/lib/action-result";

type Team = { id: string; name: string };

export function GroupPredictionForm({
  action,
  teams,
  positions,
  initialPicks,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  teams: Team[];
  positions: number[];
  initialPicks: Record<number, string>;
}) {
  const [selections, setSelections] = useState<Record<number, string>>(initialPicks);
  const hasExisting = Object.keys(initialPicks).length > 0;

  return (
    <ActionForm action={action} successMessage="Palpite salvo.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {positions.map((pos) => {
          // Um time já escolhido em outra posição some das opções das
          // demais, pra não dar pra repetir o mesmo time em dois lugares.
          const pickedElsewhere = new Set(
            Object.entries(selections)
              .filter(([p]) => Number(p) !== pos)
              .map(([, teamId]) => teamId)
              .filter(Boolean)
          );
          const availableTeams = teams.filter(
            (t) => t.id === selections[pos] || !pickedElsewhere.has(t.id)
          );

          return (
            <div key={pos}>
              <Label>{pos}º lugar</Label>
              <Select
                name={`position_${pos}`}
                value={selections[pos] ?? ""}
                onChange={(event) =>
                  setSelections((prev) => ({ ...prev, [pos]: event.target.value }))
                }
              >
                <option value="">—</option>
                {availableTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          );
        })}
      </div>
      <div className="mt-3">
        <SubmitButton pendingText="Salvando…">
          {hasExisting ? "Atualizar palpite do grupo" : "Salvar palpite do grupo"}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
