"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { useConfirm } from "@/components/confirm-provider";
import { useDeleteAction } from "@/components/use-delete-action";
import { deleteChampionship, renameChampionship } from "./actions";

type Championship = {
  id: string;
  name: string;
  created_at: string;
  logo_url?: string | null;
};

export function ChampionshipList({ items }: { items: Championship[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const confirm = useConfirm();
  const runDelete = useDeleteAction();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((championship) => (
        <Card key={championship.id} className="flex flex-col gap-3 p-5">
          {editingId === championship.id ? (
            <ActionForm
              action={(formData) => renameChampionship(championship.id, formData)}
              onSuccess={() => setEditingId(null)}
              className="flex flex-col gap-2"
            >
              <Input
                name="name"
                defaultValue={championship.name}
                autoFocus
                required
              />
              <div className="flex gap-2">
                <SubmitButton pendingText="Salvando…" className="flex-1">
                  Salvar
                </SubmitButton>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </Button>
              </div>
            </ActionForm>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {championship.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={championship.logo_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : null}
                <div>
                  <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
                    {championship.name}
                  </h2>
                  <p className="text-xs text-muted">
                    Criado em{" "}
                    {new Date(championship.created_at).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link href={`/campeonatos/${championship.id}/classificacao`}>
                  <Button variant="primary">Abrir</Button>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => setEditingId(championship.id)}
                >
                  Renomear
                </Button>
                <form
                  action={async () => {
                    const ok = await confirm({
                      title: `Excluir o campeonato "${championship.name}"?`,
                      description: "Essa ação não pode ser desfeita.",
                      confirmLabel: "Excluir",
                      danger: true,
                    });
                    if (ok) {
                      await runDelete(() => deleteChampionship(championship.id));
                    }
                  }}
                >
                  <Button type="submit" variant="danger">
                    Excluir
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
