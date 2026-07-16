"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";
import { deleteChampionship, renameChampionship } from "./actions";

type Championship = {
  id: string;
  name: string;
  created_at: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

export function ChampionshipList({ items }: { items: Championship[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((championship) => (
        <Card key={championship.id} className="flex flex-col gap-3 p-5">
          {editingId === championship.id ? (
            <form
              action={async (formData) => {
                try {
                  await renameChampionship(championship.id, formData);
                  setEditingId(null);
                } catch (error) {
                  alert(errorMessage(error));
                }
              }}
              className="flex flex-col gap-2"
            >
              <Input
                name="name"
                defaultValue={championship.name}
                autoFocus
                required
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <>
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
                    if (
                      window.confirm(
                        `Excluir o campeonato "${championship.name}"? Essa ação não pode ser desfeita.`
                      )
                    ) {
                      try {
                        await deleteChampionship(championship.id);
                      } catch (error) {
                        alert(errorMessage(error));
                      }
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
