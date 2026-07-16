"use client";

import { useState } from "react";
import { Button, Card, EmptyState, Input } from "@/components/ui";
import { deleteCoach, updateCoach } from "./actions";

type Coach = { id: string; name: string };

export function CoachTable({
  championshipId,
  coaches,
}: {
  championshipId: string;
  coaches: Coach[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (coaches.length === 0) {
    return <EmptyState>Nenhum técnico cadastrado ainda.</EmptyState>;
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Nome</th>
            <th className="w-40 px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {coaches.map((coach) => (
            <tr key={coach.id} className="border-b border-border last:border-0">
              {editingId === coach.id ? (
                <td colSpan={2} className="px-4 py-3">
                  <form
                    action={async (formData) => {
                      await updateCoach(coach.id, championshipId, formData);
                      setEditingId(null);
                    }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <Input
                      name="name"
                      defaultValue={coach.name}
                      autoFocus
                      required
                      className="max-w-xs"
                    />
                    <Button type="submit">Salvar</Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </form>
                </td>
              ) : (
                <>
                  <td className="px-4 py-3 text-foreground">{coach.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setEditingId(coach.id)}
                      >
                        Editar
                      </Button>
                      <form
                        action={async () => {
                          if (window.confirm(`Excluir o técnico "${coach.name}"?`)) {
                            await deleteCoach(coach.id, championshipId);
                          }
                        }}
                      >
                        <Button type="submit" variant="danger">
                          Excluir
                        </Button>
                      </form>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
