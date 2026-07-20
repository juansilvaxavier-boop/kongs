"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Label, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { createFinancialEntry, deleteFinancialEntry, updateFinancialEntry } from "./actions";

const CATEGORIES = [
  "Mensalidade",
  "Patrocínio",
  "Inscrição",
  "Arbitragem",
  "Local/Campo",
  "Material",
  "Outros",
];

type Team = { id: string; name: string };
type FinancialEntry = {
  id: string;
  type: string;
  category: string;
  description: string | null;
  amount: number;
  team_id: string | null;
  paid: boolean;
  entry_date: string;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function EntryFields({
  entry,
  teams,
}: {
  entry?: FinancialEntry;
  teams: Team[];
}) {
  return (
    <>
      <div className="w-32">
        <Label>Tipo</Label>
        <Select name="type" defaultValue={entry?.type ?? "receita"}>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
        </Select>
      </div>
      <div className="w-40">
        <Label>Categoria</Label>
        <Select name="category" defaultValue={entry?.category ?? CATEGORIES[0]}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex-1 basis-40">
        <Label>Descrição</Label>
        <Input name="description" defaultValue={entry?.description ?? ""} placeholder="Opcional" />
      </div>
      <div className="w-40">
        <Label>Time (opcional)</Label>
        <Select name="team_id" defaultValue={entry?.team_id ?? ""}>
          <option value="">—</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-28">
        <Label>Valor (R$)</Label>
        <Input
          name="amount"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={entry?.amount ?? ""}
        />
      </div>
      <div className="w-36">
        <Label>Data</Label>
        <Input
          name="entry_date"
          type="date"
          defaultValue={entry?.entry_date ?? new Date().toISOString().slice(0, 10)}
        />
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm text-muted">
        <input
          type="checkbox"
          name="paid"
          defaultChecked={entry?.paid ?? true}
          className="h-4 w-4 rounded border-border accent-accent"
        />
        Pago
      </label>
    </>
  );
}

export function FinancialTable({
  championshipId,
  entries,
  teams,
}: {
  championshipId: string;
  entries: FinancialEntry[];
  teams: Team[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const teamName = (teamId: string | null) => teams.find((t) => t.id === teamId)?.name ?? "—";

  return (
    <Card className="overflow-x-auto">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
          Lançamentos
        </h2>
        <Button variant="secondary" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancelar" : "+ Novo lançamento"}
        </Button>
      </div>

      {creating && (
        <div className="border-b border-border bg-surface-2/40 p-4">
          <ActionForm
            action={(formData) => createFinancialEntry(championshipId, formData)}
            onSuccess={() => setCreating(false)}
            className="flex flex-wrap items-end gap-2"
          >
            <EntryFields teams={teams} />
            <SubmitButton pendingText="Salvando…">Adicionar</SubmitButton>
          </ActionForm>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState>Nenhum lançamento cadastrado ainda.</EmptyState>
      ) : (
        <table className="w-full min-w-[54rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="w-40 px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-0">
                {editingId === entry.id ? (
                  <td colSpan={8} className="px-4 py-3">
                    <ActionForm
                      action={(formData) => updateFinancialEntry(entry.id, championshipId, formData)}
                      onSuccess={() => setEditingId(null)}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <EntryFields entry={entry} teams={teams} />
                      <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
                      <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </ActionForm>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 text-muted">{formatDate(entry.entry_date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          entry.type === "receita" ? "text-accent font-medium" : "text-danger font-medium"
                        }
                      >
                        {entry.type === "receita" ? "Receita" : "Despesa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{entry.category}</td>
                    <td className="px-4 py-3 text-muted">{entry.description ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{teamName(entry.team_id)}</td>
                    <td className="px-4 py-3 text-right font-display font-semibold text-foreground">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {entry.paid ? (
                        <Badge tone="success">Pago</Badge>
                      ) : (
                        <Badge tone="warning">Pendente</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setEditingId(entry.id)}>
                          Editar
                        </Button>
                        <form
                          action={async () => {
                            if (window.confirm("Excluir este lançamento?")) {
                              const result = await deleteFinancialEntry(entry.id, championshipId);
                              if (!result.ok) alert(result.error);
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
      )}
    </Card>
  );
}
