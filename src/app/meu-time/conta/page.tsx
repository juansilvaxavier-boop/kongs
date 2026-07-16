import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { RedefinirSenhaForm } from "@/app/redefinir-senha/redefinir-senha-form";

export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader eyebrow={user.email ?? ""} title="Minha conta" />
      <RedefinirSenhaForm />
    </div>
  );
}
