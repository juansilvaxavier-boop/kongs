import Link from "next/link";
import { Card, Input, Label } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { upsertPrediction } from "../../bolao/actions";

export function BolaoTab({
  championshipId,
  gameId,
  teamAName,
  teamBName,
  played,
  scoreA,
  scoreB,
  myPrediction,
  isLoggedIn,
}: {
  championshipId: string;
  gameId: string;
  teamAName: string;
  teamBName: string;
  played: boolean;
  scoreA: number | null;
  scoreB: number | null;
  myPrediction: { predicted_score_a: number; predicted_score_b: number } | null;
  isLoggedIn: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="mb-3 text-sm text-muted">
        Placar exato vale 3 pontos, acertar o vencedor (ou o empate) sem cravar o placar vale 1
        ponto. Só é possível dar um palpite por jogo.
      </p>
      {!isLoggedIn ? (
        <p className="text-sm text-muted">
          <Link
            href={`/login?redirectTo=/campeonato/${championshipId}/partidas/${gameId}`}
            className="text-accent hover:underline"
          >
            Entre na sua conta
          </Link>{" "}
          para dar seu palpite.
        </p>
      ) : played ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-display text-lg font-bold text-foreground">
            {scoreA} - {scoreB}
          </span>
          {myPrediction ? (
            <span className="text-muted">
              Seu palpite: {myPrediction.predicted_score_a} - {myPrediction.predicted_score_b}
            </span>
          ) : (
            <span className="text-muted">Você não deu palpite neste jogo.</span>
          )}
        </div>
      ) : (
        <ActionForm
          action={(formData) => upsertPrediction(championshipId, gameId, formData)}
          className="flex flex-wrap items-end gap-3"
          successMessage="Palpite salvo."
        >
          <div className="w-24">
            <Label>{teamAName}</Label>
            <Input
              name="predicted_score_a"
              type="number"
              min={0}
              required
              defaultValue={myPrediction?.predicted_score_a ?? ""}
            />
          </div>
          <div className="w-24">
            <Label>{teamBName}</Label>
            <Input
              name="predicted_score_b"
              type="number"
              min={0}
              required
              defaultValue={myPrediction?.predicted_score_b ?? ""}
            />
          </div>
          <SubmitButton pendingText="Salvando…">
            {myPrediction ? "Atualizar palpite" : "Salvar palpite"}
          </SubmitButton>
        </ActionForm>
      )}
    </Card>
  );
}
