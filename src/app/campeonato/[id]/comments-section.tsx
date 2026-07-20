"use client";

import Link from "next/link";
import { Badge, Card, Textarea } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { deleteComment, postComment } from "./actions";

const PERSONA_LABELS: Record<string, string> = {
  jogador: "Jogador",
  treinador: "Treinador",
  torcedor: "Torcedor",
};

export type CommentRow = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type CommentProfile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  persona: string | null;
};

export function CommentsSection({
  championshipId,
  comments,
  profiles,
  currentUserId,
}: {
  championshipId: string;
  comments: CommentRow[];
  profiles: CommentProfile[];
  currentUserId: string | null;
}) {
  const profileByUserId = new Map(profiles.map((p) => [p.user_id, p]));

  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-foreground">
        Comentários
      </h2>

      {currentUserId ? (
        <Card className="mb-5 p-4">
          <ActionForm
            action={(formData) => postComment(championshipId, formData)}
            className="flex flex-col gap-3"
          >
            <Textarea
              name="body"
              required
              maxLength={2000}
              rows={3}
              placeholder="Deixe um comentário sobre o campeonato..."
            />
            <div>
              <SubmitButton pendingText="Enviando...">Comentar</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      ) : (
        <Card className="mb-5 p-4 text-sm text-muted">
          <Link href={`/login?redirectTo=/campeonato/${championshipId}`} className="text-accent hover:underline">
            Entre na sua conta
          </Link>{" "}
          para comentar, curtir e compartilhar este campeonato.
        </Card>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted">Nenhum comentário ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => {
            const profile = profileByUserId.get(comment.user_id);
            const name =
              [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
              "Usuário";
            return (
              <Card key={comment.id} className="p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">
                        {name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted">
                        {new Date(comment.created_at).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    {profile?.persona && (
                      <Badge>{PERSONA_LABELS[profile.persona] ?? profile.persona}</Badge>
                    )}
                  </div>
                  {currentUserId === comment.user_id && (
                    <ActionForm
                      action={() => deleteComment(championshipId, comment.id)}
                    >
                      <button
                        type="submit"
                        className="text-xs text-muted hover:text-danger"
                      >
                        Excluir
                      </button>
                    </ActionForm>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
