import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui";
import { UsersTable } from "./users-table";

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
        <UsersTable users={users} currentUserId={user.id} />
      )}
    </div>
  );
}
