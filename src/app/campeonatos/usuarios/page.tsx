import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui";
import { UsersTable } from "./users-table";
import { CustomRolesSection } from "./custom-roles-section";

export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: users, error }, { data: roles }] = await Promise.all([
    supabase.rpc("admin_list_users"),
    supabase.from("custom_roles").select("id, name, permissions").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Gestão de usuários" title="Usuários" />

      <CustomRolesSection roles={roles ?? []} />

      {error ? (
        <EmptyState>Não foi possível carregar os usuários: {error.message}</EmptyState>
      ) : !users || users.length === 0 ? (
        <EmptyState>Nenhum usuário cadastrado ainda.</EmptyState>
      ) : (
        <UsersTable users={users} currentUserId={user.id} roles={roles ?? []} />
      )}
    </div>
  );
}
