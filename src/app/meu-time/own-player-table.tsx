"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { useConfirm } from "@/components/confirm-provider";
import { useDeleteAction } from "@/components/use-delete-action";
import { PLAYER_POSITIONS } from "@/lib/positions";
import { deleteOwnPlayer, updateOwnPlayer } from "./actions";

type Player = {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
};

function PlayerEditForm({
  player,
  onDone,
  onCancel,
}: {
  player: Player;
  onDone: () => void;
  onCancel: () => void;
}) {
  return (
    <ActionForm
      action={(formData) => updateOwnPlayer(player.id, formData)}
      onSuccess={onDone}
      className="flex flex-wrap items-center gap-2"
    >
      <Input name="name" defaultValue={player.name} autoFocus required className="max-w-[10rem]" />
      <Input
        name="number"
        type="number"
        defaultValue={player.number ?? ""}
        placeholder="Nº"
        className="max-w-[5rem]"
      />
      <Select name="position" defaultValue={player.position ?? ""} className="max-w-[9rem]">
        <option value="">Posição</option>
        {PLAYER_POSITIONS.map((position) => (
          <option key={position} value={position}>
            {position}
          </option>
        ))}
      </Select>
      <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancelar
      </Button>
    </ActionForm>
  );
}

function PlayerActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onEdit}>
        Editar
      </Button>
      <form action={onDelete}>
        <Button type="submit" variant="danger">
          Excluir
        </Button>
      </form>
    </div>
  );
}

export function OwnPlayerTable({ players }: { players: Player[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const confirm = useConfirm();
  const runDelete = useDeleteAction();

  if (players.length === 0) {
    return <EmptyState>Nenhum jogador cadastrado ainda.</EmptyState>;
  }

  async function handleDelete(player: Player) {
    const ok = await confirm({
      title: `Excluir o jogador "${player.name}"?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (ok) {
      await runDelete(() => deleteOwnPlayer(player.id));
    }
  }

  return (
    <>
      {/* Desktop: tabela */}
      <Card className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[28rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Jogador</th>
              <th className="px-4 py-3">Nº</th>
              <th className="px-4 py-3">Posição</th>
              <th className="w-40 px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id} className="border-b border-border last:border-0">
                {editingId === player.id ? (
                  <td colSpan={4} className="px-4 py-3">
                    <PlayerEditForm
                      player={player}
                      onDone={() => setEditingId(null)}
                      onCancel={() => setEditingId(null)}
                    />
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-foreground">{player.name}</td>
                    <td className="px-4 py-3 text-muted">{player.number ?? "—"}</td>
                    <td className="px-4 py-3">
                      {player.position ? (
                        <Badge>{player.position}</Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PlayerActions
                        onEdit={() => setEditingId(player.id)}
                        onDelete={() => handleDelete(player)}
                      />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile: cards empilhados */}
      <div className="flex flex-col gap-3 sm:hidden">
        {players.map((player) => (
          <Card key={player.id} className="p-3">
            {editingId === player.id ? (
              <PlayerEditForm
                player={player}
                onDone={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{player.name}</span>
                  {player.position && <Badge>{player.position}</Badge>}
                </div>
                <p className="text-xs text-muted">Nº {player.number ?? "—"}</p>
                <div className="mt-2">
                  <PlayerActions
                    onEdit={() => setEditingId(player.id)}
                    onDelete={() => handleDelete(player)}
                  />
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
