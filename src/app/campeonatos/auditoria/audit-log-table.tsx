"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, EmptyState, Select } from "@/components/ui";
import type { Json } from "@/lib/supabase/types";

type AuditLogRow = {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  championship_id: string | null;
  championship_name: string | null;
  old_data: Json | null;
  new_data: Json | null;
  total_count: number;
};

type Championship = { id: string; name: string };

function asRecord(value: Json | null): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

const TABLE_LABELS: Record<string, string> = {
  championships: "Campeonato",
  teams: "Time",
  coaches: "Técnico",
  games: "Jogo",
  referees: "Árbitro",
  venues: "Local",
  financial_entries: "Financeiro",
  sponsors: "Patrocinador",
  user_roles: "Cargo de admin",
  user_permissions: "Permissão",
};

const ACTION_LABELS: Record<string, string> = {
  insert: "Criado",
  update: "Editado",
  delete: "Removido",
};

function ActionBadge({ action }: { action: string }) {
  const tone = action === "insert" ? "success" : action === "delete" ? "warning" : "default";
  return <Badge tone={tone}>{ACTION_LABELS[action] ?? action}</Badge>;
}

function recordLabel(row: AuditLogRow) {
  const data = asRecord(row.new_data) ?? asRecord(row.old_data);
  if (!data) return row.record_id ?? "—";
  const candidates = ["name", "description", "category", "permission", "role"];
  for (const key of candidates) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return row.record_id ?? "—";
}

function changedFields(old_: Json | null, new_: Json | null) {
  const oldData = asRecord(old_);
  const newData = asRecord(new_);
  if (!oldData || !newData) return [];
  const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  const ignored = new Set(["created_at", "updated_at", "id"]);
  const changes: { key: string; oldValue: unknown; newValue: unknown }[] = [];
  for (const key of keys) {
    if (ignored.has(key)) continue;
    const oldValue = oldData[key];
    const newValue = newData[key];
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ key, oldValue, newValue });
    }
  }
  return changes;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "sim" : "não";
  return String(value);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function RowDetails({ row }: { row: AuditLogRow }) {
  if (row.action === "update") {
    const changes = changedFields(row.old_data, row.new_data);
    if (changes.length === 0) return <p className="text-xs text-muted">Nenhum campo alterado.</p>;
    return (
      <ul className="space-y-1 text-xs">
        {changes.map((change) => (
          <li key={change.key} className="flex flex-wrap items-center gap-1">
            <span className="font-semibold text-foreground">{change.key}:</span>
            <span className="text-muted line-through">{formatValue(change.oldValue)}</span>
            <span className="text-muted">→</span>
            <span className="text-foreground">{formatValue(change.newValue)}</span>
          </li>
        ))}
      </ul>
    );
  }

  const data = asRecord(row.action === "delete" ? row.old_data : row.new_data);
  if (!data) return null;
  return (
    <ul className="space-y-1 text-xs">
      {Object.entries(data)
        .filter(([key]) => key !== "id")
        .map(([key, value]) => (
          <li key={key} className="flex flex-wrap items-center gap-1">
            <span className="font-semibold text-foreground">{key}:</span>
            <span className="text-muted">{formatValue(value)}</span>
          </li>
        ))}
    </ul>
  );
}

export function AuditLogTable({
  rows,
  totalCount,
  page,
  pageSize,
  championships,
  filters,
}: {
  rows: AuditLogRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  championships: Championship[];
  filters: { tabela: string; acao: string; campeonato: string };
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const championshipName = (id: string | null) =>
    championships.find((c) => c.id === id)?.name ?? "—";

  function navigate(next: Partial<{ tabela: string; acao: string; campeonato: string; pagina: number }>) {
    const merged = {
      tabela: filters.tabela,
      acao: filters.acao,
      campeonato: filters.campeonato,
      pagina: page,
      ...next,
    };
    const params = new URLSearchParams();
    if (merged.tabela) params.set("tabela", merged.tabela);
    if (merged.acao) params.set("acao", merged.acao);
    if (merged.campeonato) params.set("campeonato", merged.campeonato);
    if (merged.pagina > 1) params.set("pagina", String(merged.pagina));
    const query = params.toString();
    router.push(query ? `/campeonatos/auditoria?${query}` : "/campeonatos/auditoria");
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-2/40 px-4 py-3">
        <Select
          value={filters.tabela}
          onChange={(event) => navigate({ tabela: event.target.value, pagina: 1 })}
          className="w-44"
        >
          <option value="">Todas as tabelas</option>
          {Object.entries(TABLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={filters.acao}
          onChange={(event) => navigate({ acao: event.target.value, pagina: 1 })}
          className="w-36"
        >
          <option value="">Todas as ações</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={filters.campeonato}
          onChange={(event) => navigate({ campeonato: event.target.value, pagina: 1 })}
          className="w-48"
        >
          <option value="">Todos os campeonatos</option>
          {championships.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState>Nenhum registro encontrado para os filtros selecionados.</EmptyState>
      ) : (
        <>
          {/* Mobile: cards empilhados */}
          <div className="flex flex-col gap-3 p-4 sm:hidden">
            {rows.map((row) => (
              <Card key={row.id} className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <ActionBadge action={row.action} />
                  <span className="text-xs text-muted">{formatDateTime(row.created_at)}</span>
                </div>
                <p className="font-medium text-foreground">
                  {TABLE_LABELS[row.table_name] ?? row.table_name} · {recordLabel(row)}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted">
                  <dt>Por</dt>
                  <dd className="text-right text-foreground">
                    {row.actor_name || row.actor_email || "Sistema"}
                  </dd>
                  <dt>Campeonato</dt>
                  <dd className="text-right text-foreground">
                    {row.championship_name ?? championshipName(row.championship_id)}
                  </dd>
                </dl>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                  >
                    {expandedId === row.id ? "Ocultar" : "Detalhes"}
                  </Button>
                </div>
                {expandedId === row.id && (
                  <div className="mt-2 border-t border-border pt-2">
                    <RowDetails row={row} />
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Desktop: tabela */}
          <table className="hidden w-full min-w-[54rem] text-sm sm:table">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Tabela</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">Campeonato</th>
                <th className="px-4 py-3">Por</th>
                <th className="w-24 px-4 py-3 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Fragment key={row.id}>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted">{formatDateTime(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <ActionBadge action={row.action} />
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {TABLE_LABELS[row.table_name] ?? row.table_name}
                    </td>
                    <td className="px-4 py-3 text-foreground">{recordLabel(row)}</td>
                    <td className="px-4 py-3 text-muted">
                      {row.championship_name ?? championshipName(row.championship_id)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {row.actor_name || row.actor_email || "Sistema"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                      >
                        {expandedId === row.id ? "Ocultar" : "Ver"}
                      </Button>
                    </td>
                  </tr>
                  {expandedId === row.id && (
                    <tr className="border-b border-border bg-surface-2/30 last:border-0">
                      <td colSpan={7} className="px-4 py-3">
                        <RowDetails row={row} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 text-sm text-muted">
              <span>
                Página {page} de {totalPages} · {totalCount} registros
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => navigate({ pagina: page - 1 })}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => navigate({ pagina: page + 1 })}
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
