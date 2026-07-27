"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { PERMISSION_LABELS, type Permission } from "@/lib/auth/roles";
import {
  adminResetUserPassword,
  applyCustomRole,
  setUserAdmin,
  setUserPermission,
} from "./actions";
import type { CustomRole } from "./custom-roles-section";

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

const PAGE_SIZE = 20;

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

function AdminToggle({
  row,
  name,
  isAdmin,
  isSelf,
}: {
  row: UserRow;
  name: string;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const confirm = useConfirm();
  const toast = useToast();

  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-border accent-accent"
        defaultChecked={isAdmin}
        disabled={isSelf}
        title={isSelf ? "Você não pode remover seu próprio cargo de admin." : undefined}
        onChange={async (event) => {
          const next = event.target.checked;
          const ok = await confirm({
            title: next
              ? `Tornar "${name || row.email}" administrador?`
              : `Remover o cargo de administrador de "${name || row.email}"?`,
            description: next
              ? "Isso dá acesso total ao sistema, incluindo gestão de usuários."
              : undefined,
            confirmLabel: next ? "Tornar admin" : "Remover",
            danger: !next,
          });
          if (!ok) {
            event.target.checked = !next;
            return;
          }
          const result = await setUserAdmin(row.user_id, next);
          if (!result.ok) {
            toast.error(result.error);
            event.target.checked = !next;
          }
        }}
      />
      {isAdmin ? <Badge tone="success">Admin</Badge> : <span className="text-muted">—</span>}
    </label>
  );
}

function PermissionCheckboxes({ row, isAdmin }: { row: UserRow; isAdmin: boolean }) {
  const toast = useToast();
  const grantedPermissions = new Set(row.permissions ?? []);

  if (isAdmin) {
    return <span className="text-xs text-muted">Acesso total (admin)</span>;
  }

  return (
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
                toast.error(result.error);
                event.target.checked = !next;
              }
            }}
          />
          {PERMISSION_LABELS[permission]}
        </label>
      ))}
    </div>
  );
}

function ApplyRoleSelect({ userId, roles }: { userId: string; roles: CustomRole[] }) {
  const [roleId, setRoleId] = useState("");
  const [pending, setPending] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  if (roles.length === 0) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <Select
        value={roleId}
        onChange={(event) => setRoleId(event.target.value)}
        className="max-w-[10rem] text-xs"
      >
        <option value="">Aplicar cargo…</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </Select>
      <Button
        variant="secondary"
        disabled={!roleId || pending}
        onClick={async () => {
          const role = roles.find((r) => r.id === roleId);
          const ok = await confirm({
            title: `Aplicar o cargo "${role?.name}" a este usuário?`,
            description: "Isso substitui as permissões atuais do usuário pelas deste cargo.",
            confirmLabel: "Aplicar",
          });
          if (!ok) return;
          setPending(true);
          const result = await applyCustomRole(userId, roleId);
          setPending(false);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Cargo aplicado.");
          setRoleId("");
        }}
      >
        {pending ? "Aplicando…" : "Aplicar"}
      </Button>
    </div>
  );
}

function ResetPasswordControl({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Redefinir senha
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <PasswordInput
        placeholder="Nova senha (mín. 6 caracteres)"
        value={password}
        minLength={6}
        onChange={(event) => setPassword(event.target.value)}
        className="max-w-[14rem] text-xs"
      />
      <div className="flex gap-2">
        <Button
          disabled={password.length < 6 || pending}
          onClick={async () => {
            const ok = await confirm({
              title: `Redefinir a senha de "${name}"?`,
              description:
                "O usuário será desconectado de todas as sessões ativas e precisará usar a nova senha no próximo login.",
              confirmLabel: "Redefinir",
              danger: true,
            });
            if (!ok) return;
            setPending(true);
            const result = await adminResetUserPassword(userId, password);
            setPending(false);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Senha redefinida.");
            setPassword("");
            setOpen(false);
          }}
        >
          {pending ? "Salvando…" : "Confirmar"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setPassword("");
            setOpen(false);
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function UsersTable({
  users,
  currentUserId,
  roles,
}: {
  users: UserRow[];
  currentUserId: string;
  roles: CustomRole[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((row) => {
      const name = [row.first_name, row.last_name].filter(Boolean).join(" ").toLowerCase();
      return name.includes(q) || (row.email ?? "").toLowerCase().includes(q);
    });
  }, [users, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Buscar por nome ou e-mail…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(0);
        }}
        className="max-w-xs"
      />

      {/* Mobile: cards empilhados */}
      <div className="flex flex-col gap-3 sm:hidden">
        {paginated.map((row) => {
          const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
          const isAdmin = row.role === "admin";
          const isSelf = row.user_id === currentUserId;

          return (
            <Card key={row.user_id} className="p-4">
              <div className="mb-2 flex items-center gap-2">
                {row.avatar_url ? (
                  <span className="relative h-8 w-8 shrink-0">
                    <Image src={row.avatar_url} alt="" fill loading="eager" sizes="32px" className="rounded-full object-cover" />
                  </span>
                ) : null}
                <span className="font-medium text-foreground">{name || "—"}</span>
                {isSelf && <Badge>Você</Badge>}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted">
                <dt>E-mail</dt>
                <dd className="text-right text-foreground">{row.email ?? "—"}</dd>
                <dt>Perfil</dt>
                <dd className="text-right text-foreground">
                  {row.persona ? PERSONA_LABELS[row.persona] ?? row.persona : "—"}
                </dd>
                <dt>Cadastro</dt>
                <dd className="text-right text-foreground">{formatDate(row.created_at)}</dd>
                <dt>Último acesso</dt>
                <dd className="text-right text-foreground">{formatDateTime(row.last_sign_in_at)}</dd>
              </dl>
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Admin</p>
                <AdminToggle row={row} name={name} isAdmin={isAdmin} isSelf={isSelf} />
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Permissões
                </p>
                <PermissionCheckboxes row={row} isAdmin={isAdmin} />
                {!isAdmin && <ApplyRoleSelect userId={row.user_id} roles={roles} />}
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Senha</p>
                <ResetPasswordControl userId={row.user_id} name={name || row.email || "usuário"} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Desktop: tabela */}
      <Card className="hidden overflow-x-auto sm:block">
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
              <th className="px-4 py-3">Senha</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => {
              const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
              const isAdmin = row.role === "admin";
              const isSelf = row.user_id === currentUserId;

              return (
                <tr key={row.user_id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {row.avatar_url ? (
                        <span className="relative h-7 w-7 shrink-0">
                          <Image
                            src={row.avatar_url}
                            alt=""
                            fill
                            loading="eager"
                            sizes="28px"
                            className="rounded-full object-cover"
                          />
                        </span>
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
                    <AdminToggle row={row} name={name} isAdmin={isAdmin} isSelf={isSelf} />
                  </td>
                  <td className="px-4 py-3">
                    <PermissionCheckboxes row={row} isAdmin={isAdmin} />
                    {!isAdmin && <ApplyRoleSelect userId={row.user_id} roles={roles} />}
                  </td>
                  <td className="px-4 py-3">
                    <ResetPasswordControl userId={row.user_id} name={name || row.email || "usuário"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">Nenhum usuário encontrado.</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Página {currentPage + 1} de {totalPages} · {filtered.length} usuários
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
    </div>
  );
}
