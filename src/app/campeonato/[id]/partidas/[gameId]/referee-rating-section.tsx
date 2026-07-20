"use client";

import { Card, Label, Select, Textarea } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { upsertRefereeRating } from "./referee-rating-actions";

export function RefereeRatingSection({
  championshipId,
  gameId,
  teamId,
  refereeId,
  refereeName,
  existingRating,
}: {
  championshipId: string;
  gameId: string;
  teamId: string;
  refereeId: string;
  refereeName: string;
  existingRating: { rating: number; comment: string | null } | null;
}) {
  return (
    <Card className="p-4">
      <h3 className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-foreground">
        Avaliação de arbitragem
      </h3>
      <p className="mb-3 text-xs text-muted">Árbitro: {refereeName}</p>

      <ActionForm
        action={(formData) =>
          upsertRefereeRating(championshipId, gameId, teamId, refereeId, formData)
        }
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        successMessage="Avaliação enviada."
      >
        <div className="w-32">
          <Label>Nota</Label>
          <Select name="rating" defaultValue={String(existingRating?.rating ?? 5)}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"⭐".repeat(n)} ({n})
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1 basis-48">
          <Label>Comentário (opcional)</Label>
          <Textarea
            name="comment"
            rows={2}
            defaultValue={existingRating?.comment ?? ""}
            placeholder="Como foi a arbitragem?"
          />
        </div>
        <SubmitButton pendingText="Enviando…">
          {existingRating ? "Atualizar avaliação" : "Enviar avaliação"}
        </SubmitButton>
      </ActionForm>
    </Card>
  );
}
