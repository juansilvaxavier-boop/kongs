"use client";

import { useState } from "react";
import { Button, Card, Input, Label } from "./ui";
import { useToast } from "./toast-provider";
import type { ActionResult } from "@/lib/action-result";

export function PenaltyShootoutPanel({
  teamAName,
  teamBName,
  penaltyScoreA,
  penaltyScoreB,
  onSave,
}: {
  teamAName: string;
  teamBName: string;
  penaltyScoreA: number | null;
  penaltyScoreB: number | null;
  onSave: (penaltyScoreA: number | null, penaltyScoreB: number | null) => Promise<ActionResult>;
}) {
  const hasPenalties = penaltyScoreA !== null && penaltyScoreB !== null;
  const [editing, setEditing] = useState(false);
  const [a, setA] = useState(penaltyScoreA?.toString() ?? "");
  const [b, setB] = useState(penaltyScoreB?.toString() ?? "");
  const [pending, setPending] = useState(false);
  const toast = useToast();

  async function save() {
    const parsedA = Number(a);
    const parsedB = Number(b);
    if (!Number.isInteger(parsedA) || parsedA < 0 || !Number.isInteger(parsedB) || parsedB < 0) {
      toast.error("Informe um placar de pênaltis válido.");
      return;
    }
    if (parsedA === parsedB) {
      toast.error("A disputa de pênaltis não pode terminar empatada.");
      return;
    }
    setPending(true);
    const result = await onSave(parsedA, parsedB);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Pênaltis salvos.");
    setEditing(false);
  }

  async function remove() {
    setPending(true);
    const result = await onSave(null, null);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Pênaltis removidos.");
    setEditing(false);
    setA("");
    setB("");
  }

  if (!hasPenalties && !editing) {
    return (
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            Jogo empatado — se foi decidido nos pênaltis, registre o placar da disputa.
          </p>
          <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
            Lançar pênaltis
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-4 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
        Disputa de pênaltis
      </p>
      {editing ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-24">
            <Label>{teamAName}</Label>
            <Input value={a} onChange={(e) => setA(e.target.value)} type="number" min={0} />
          </div>
          <div className="w-24">
            <Label>{teamBName}</Label>
            <Input value={b} onChange={(e) => setB(e.target.value)} type="number" min={0} />
          </div>
          <Button type="button" disabled={pending} onClick={save}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-lg font-bold text-foreground">
            {teamAName} {penaltyScoreA} - {penaltyScoreB} {teamBName}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button type="button" variant="danger" disabled={pending} onClick={remove}>
              Remover
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
