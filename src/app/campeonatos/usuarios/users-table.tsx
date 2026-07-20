"use client";

import { Badge, Card } from "@/components/ui";
import { PERMISSION_LABELS, type Permission } from "@/lib/auth/roles";
import { setUserAdmin, setUserPermission } from "./actions";

const PERMISSIONS: Permission[] = [
  "manage_championships",
  "manage_teams_games",
  "manage_finance",
  "manage_sponsors",
];

const PERSONA_LABELS: Record<string, string> = {
  jogador: "Jogador",
  treinador: "Treinador",
  torcedor: "Torcedor",
};

export type UserRow = {
  user_id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  first_name: string | null;
  last_name: string | null;
  persona: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  permissions: string[] | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { dateStyle: "short" });
}

function formatDateTime(value: string | null) {
  if (!value) return "Nunca";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[64rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Perfil</th>
            <th className="px-4 py-3">Cadastro</th>
            <th className="px-4 py-3">Último acesso</th>
            <th className="px-4 py-3">Admin</th>
            <th className="px-4 py-3">Permissões</th>
          </tr>
        </thead>
        <tbody>
          {users.map((row) => {
            const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
            const isAdmin = row.role === "admin";
            const isSelf = row.user_id === currentUserId;
            const grantedPermissions = new Set(row.permissions ?? []);

            return (
              <tr key={row.user_id} className="border-b border-border last:border-0 align-top">
                <td className="px-4 py-3 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {row.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.avatar_url}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : null}
                    <span>{name || "—"}</span>
                    {isSelf && <Badge>Você</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{row.email ?? "—"}</td>
                <td className="px-4 py-3 text-muted">
                  {row.persona ? PERSONA_LABELS[row.persona] ?? row.persona : "—"}
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(row.created_at)}</td>
                <td className="px-4 py-3 text-muted">{formatDateTime(row.last_sign_in_at)}</td>
                <td className="px-4 py-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border accent-accent"
                      defaultChecked={isAdmin}
                      disabled={isSelf}
                      title={isSelf ? "Você não pode remover seu próprio cargo de admin." : undefined}
                      onChange={async (event) => {
                        const next = event.target.checked;
                        const confirmMessage = next
                          ? `Tornar "${name || row.email}" administrador com acesso total ao sistema?`
                          : `Remover o cargo de administrador de "${name || row.email}"?`;
                        if (!window.confirm(confirmMessage)) {
                          event.target.checked = !next;
                          return;
                        }
                        const result = await setUserAdmin(row.user_id, next);
                        if (!result.ok) {
                          alert(result.error);
                          event.target.checked = !next;
                        }
                      }}
                    />
                    {isAdmin ? <Badge tone="success">Admin</Badge> : <span className="text-muted">—</span>}
                  </label>
                </td>
                <td className="px-4 py-3">
                  {isAdmin ? (
                    <span className="text-xs text-muted">Acesso total (admin)</span>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {PERMISSIONS.map((permission) => (
                        <label key={permission} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border accent-accent"
                            defaultChecked={grantedPermissions.has(permission)}
                            onChange={async (event) => {
                              const next = event.target.checked;
                              const result = await setUserPermission(row.user_id, permission, next);
                              if (!result.ok) {
                                alert(result.error);
                                event.target.checked = !next;
                              }
                            }}
                          />
                          {PERMISSION_LABELS[permission]}
                        </label>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
