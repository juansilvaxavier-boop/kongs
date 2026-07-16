import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

export default async function RedefinirSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="pitch-lines flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          Nova senha
        </p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
          Redefinir senha
        </h1>
      </div>
      <RedefinirSenhaForm />
    </main>
  );
}
