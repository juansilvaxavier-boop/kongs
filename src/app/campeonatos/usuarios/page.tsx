import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

const PERSONA_LABELS: Record<string, string> = {
  jogador: "Jogador",
  treinador: "Treinador",
  torcedor: "Torcedor",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", {
    dateStyle: "short",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "Nunca";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: users, error } = await supabase.rpc("admin_list_users");

  return (
    <div>
      <PageHeader eyebrow="Gestão de usuários" title="Usuários" />

      {error ? (
        <EmptyState>Não foi possível carregar os usuários: {error.message}</EmptyState>
      ) : !users || users.length === 0 ? (
        <EmptyState>Nenhum usuário cadastrado ainda.</EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Cadastro</th>
                <th className="px-4 py-3">Último acesso</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => {
                const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
                return (
                  <tr key={row.user_id} className="border-b border-border last:border-0">
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
                        {row.role === "admin" && <Badge tone="success">Admin</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{row.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">
                      {row.persona ? PERSONA_LABELS[row.persona] ?? row.persona : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{row.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3 text-muted">
                      {formatDateTime(row.last_sign_in_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
