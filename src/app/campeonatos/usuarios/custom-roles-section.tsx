"use client";

import { useState } from "react";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { useConfirm } from "@/components/confirm-provider";
import { useDeleteAction } from "@/components/use-delete-action";
import { PERMISSION_LABELS, type Permission } from "@/lib/auth/roles";
import { createCustomRole, deleteCustomRole } from "./actions";

const PERMISSIONS: Permission[] = [
  "manage_championships",
  "manage_teams_games",
  "manage_finance",
  "manage_sponsors",
];

export type CustomRole = {
  id: string;
  name: string;
  permissions: string[];
};

function DeleteRoleButton({ roleId, roleName }: { roleId: string; roleName: string }) {
  const confirm = useConfirm();
  const runDelete = useDeleteAction();

  return (
    <button
      type="button"
      className="text-xs text-muted underline hover:text-danger"
      onClick={async () => {
        const ok = await confirm({
          title: `Excluir o cargo "${roleName}"?`,
          description: "Usuários que já receberam essas permissões continuam com elas.",
          confirmLabel: "Excluir",
          danger: true,
        });
        if (!ok) return;
        await runDelete(() => deleteCustomRole(roleId));
      }}
    >
      excluir
    </button>
  );
}

export function CustomRolesSection({ roles }: { roles: CustomRole[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
          Cargos customizados
        </h3>
        <Button variant="secondary" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancelar" : "+ Novo cargo"}
        </Button>
      </div>

      {roles.length === 0 && !creating && (
        <p className="text-sm text-muted">
          Nenhum cargo criado ainda. Um cargo agrupa uma combinação de permissões para aplicar de
          uma vez a um usuário.
        </p>
      )}

      {roles.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {roles.map((role) => (
            <li
              key={role.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-2/60 px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">{role.name}</span>
                {role.permissions.map((permission) => (
                  <Badge key={permission} tone="default">
                    {PERMISSION_LABELS[permission as Permission] ?? permission}
                  </Badge>
                ))}
              </div>
              <DeleteRoleButton roleId={role.id} roleName={role.name} />
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <ActionForm
          action={async (formData) => {
            const name = String(formData.get("name") || "");
            const permissions = PERMISSIONS.filter((p) => formData.get(`permission_${p}`) === "on");
            return createCustomRole(name, permissions);
          }}
          onSuccess={() => setCreating(false)}
          successMessage="Cargo criado."
          className="flex flex-col gap-3 border-t border-border pt-3"
        >
          <div className="max-w-xs">
            <Label>Nome do cargo</Label>
            <Input name="name" required placeholder="Ex.: Gestor financeiro" />
          </div>
          <div className="flex flex-col gap-1.5">
            {PERMISSIONS.map((permission) => (
              <label key={permission} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`permission_${permission}`}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                {PERMISSION_LABELS[permission]}
              </label>
            ))}
          </div>
          <div>
            <SubmitButton pendingText="Criando…">Criar cargo</SubmitButton>
          </div>
        </ActionForm>
      )}
    </Card>
  );
}
