"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Label, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import {
  computeEntryPaymentStatus,
  type FinancialPaymentStatus,
} from "@/lib/financial";
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

const STATUS_LABELS: Record<FinancialPaymentStatus, string> = {
  pago: "Pago",
  parcial: "Parcial",
  pendente: "Pendente",
};

const PAGE_SIZE = 20;

type Team = { id: string; name: string };
type FinancialEntry = {
  id: string;
  type: string;
  category: string;
  description: string | null;
  amount: number;
  team_id: string | null;
  paid_amount: number;
  entry_date: string;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function TypeBadge({ type }: { type: string }) {
  return type === "receita" ? (
    <Badge tone="success">Receita</Badge>
  ) : (
    <Badge tone="warning">Despesa</Badge>
  );
}

function PaymentBadge({ amount, paidAmount }: { amount: number; paidAmount: number }) {
  const status = computeEntryPaymentStatus(amount, paidAmount);
  if (status === "pago") return <Badge tone="success">Pago</Badge>;
  if (status === "parcial") {
    return (
      <Badge tone="warning">
        Parcial · {formatCurrency(paidAmount)} de {formatCurrency(amount)}
      </Badge>
    );
  }
  return <Badge>Pendente</Badge>;
}

function EntryFields({
  entry,
  teams,
}: {
  entry?: FinancialEntry;
  teams: Team[];
}) {
  const [status, setStatus] = useState<FinancialPaymentStatus>(
    entry ? computeEntryPaymentStatus(entry.amount, entry.paid_amount) : "pago"
  );

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
      <div className="w-36">
        <Label>Status do pagamento</Label>
        <Select
          name="payment_status"
          value={status}
          onChange={(event) => setStatus(event.target.value as FinancialPaymentStatus)}
        >
          <option value="pago">Pago</option>
          <option value="parcial">Parcial</option>
          <option value="pendente">Pendente</option>
        </Select>
      </div>
      {status === "parcial" && (
        <div className="w-32">
          <Label>Valor pago (R$)</Label>
          <Input
            name="partial_amount"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={entry?.paid_amount ?? ""}
          />
        </div>
      )}
    </>
  );
}

function DeleteEntryButton({ entryId, championshipId }: { entryId: string; championshipId: string }) {
  const confirm = useConfirm();
  const toast = useToast();

  return (
    <form
      action={async () => {
        const ok = await confirm({
          title: "Excluir este lançamento?",
          confirmLabel: "Excluir",
          danger: true,
        });
        if (ok) {
          const result = await deleteFinancialEntry(entryId, championshipId);
          if (!result.ok) toast.error(result.error);
        }
      }}
    >
      <Button type="submit" variant="danger">
        Excluir
      </Button>
    </form>
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
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [page, setPage] = useState(0);
  const teamName = (teamId: string | null) => teams.find((t) => t.id === teamId)?.name ?? "—";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (typeFilter && entry.type !== typeFilter) return false;
      if (categoryFilter && entry.category !== categoryFilter) return false;
      if (teamFilter && entry.team_id !== teamFilter) return false;
      if (statusFilter && computeEntryPaymentStatus(entry.amount, entry.paid_amount) !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        entry.category.toLowerCase().includes(q) ||
        (entry.description ?? "").toLowerCase().includes(q) ||
        teamName(entry.team_id).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, query, typeFilter, statusFilter, categoryFilter, teamFilter, teams]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function resetPage() {
    setPage(0);
  }

  return (
    <Card className="overflow-x-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
          Lançamentos
        </h2>
        <Button variant="secondary" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancelar" : "+ Novo lançamento"}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2 border-b border-border bg-surface-2/30 px-4 py-3">
        <div className="w-44">
          <Label>Buscar</Label>
          <Input
            placeholder="Categoria, descrição, time…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
          />
        </div>
        <div className="w-32">
          <Label>Tipo</Label>
          <Select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              resetPage();
            }}
          >
            <option value="">Todos</option>
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </Select>
        </div>
        <div className="w-32">
          <Label>Status</Label>
          <Select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              resetPage();
            }}
          >
            <option value="">Todos</option>
            {(Object.keys(STATUS_LABELS) as FinancialPaymentStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Label>Categoria</Label>
          <Select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              resetPage();
            }}
          >
            <option value="">Todas</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>
        {teams.length > 0 && (
          <div className="w-40">
            <Label>Time</Label>
            <Select
              value={teamFilter}
              onChange={(event) => {
                setTeamFilter(event.target.value);
                resetPage();
              }}
            >
              <option value="">Todos</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        {(query || typeFilter || statusFilter || categoryFilter || teamFilter) && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setQuery("");
              setTypeFilter("");
              setStatusFilter("");
              setCategoryFilter("");
              setTeamFilter("");
              resetPage();
            }}
          >
            Limpar filtros
          </Button>
        )}
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

      {filtered.length === 0 ? (
        <EmptyState>Nenhum lançamento encontrado.</EmptyState>
      ) : (
        <>
          {/* Mobile: cards empilhados */}
          <div className="flex flex-col gap-3 p-4 sm:hidden">
            {paginated.map((entry) =>
              editingId === entry.id ? (
                <Card key={entry.id} className="p-3">
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
                </Card>
              ) : (
                <Card key={entry.id} className="p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <TypeBadge type={entry.type} />
                    <PaymentBadge amount={entry.amount} paidAmount={entry.paid_amount} />
                  </div>
                  <p className="font-medium text-foreground">{entry.category}</p>
                  {entry.description && <p className="text-xs text-muted">{entry.description}</p>}
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted">
                    <dt>Time</dt>
                    <dd className="text-right text-foreground">{teamName(entry.team_id)}</dd>
                    <dt>Data</dt>
                    <dd className="text-right text-foreground">{formatDate(entry.entry_date)}</dd>
                  </dl>
                  <p className="mt-2 text-right font-display text-lg font-semibold text-foreground">
                    {formatCurrency(entry.amount)}
                  </p>
                  <div className="mt-2 flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditingId(entry.id)}>
                      Editar
                    </Button>
                    <DeleteEntryButton entryId={entry.id} championshipId={championshipId} />
                  </div>
                </Card>
              )
            )}
          </div>

          {/* Desktop: tabela */}
          <table className="hidden w-full min-w-[54rem] text-sm sm:table">
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
              {paginated.map((entry) => (
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
                        <TypeBadge type={entry.type} />
                      </td>
                      <td className="px-4 py-3 text-foreground">{entry.category}</td>
                      <td className="px-4 py-3 text-muted">{entry.description ?? "—"}</td>
                      <td className="px-4 py-3 text-muted">{teamName(entry.team_id)}</td>
                      <td className="px-4 py-3 text-right font-display font-semibold text-foreground">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentBadge amount={entry.amount} paidAmount={entry.paid_amount} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" onClick={() => setEditingId(entry.id)}>
                            Editar
                          </Button>
                          <DeleteEntryButton entryId={entry.id} championshipId={championshipId} />
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 text-sm text-muted">
              <span>
                Página {currentPage + 1} de {totalPages} · {filtered.length} lançamentos
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={currentPage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
