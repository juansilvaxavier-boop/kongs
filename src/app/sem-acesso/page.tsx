import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Button, Card } from "@/components/ui";

export default async function SemAcessoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="pitch-lines flex flex-1 flex-col items-center justify-center px-4 py-16">
      <Card className="max-w-md p-6 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {user.email}
        </p>
        <h1 className="mb-3 font-display text-xl font-bold uppercase tracking-wide text-foreground">
          Sua conta ainda não tem permissões
        </h1>
        <p className="mb-5 text-sm text-muted">
          Peça para o organizador do campeonato te convidar como dono de time
          usando este mesmo e-mail. Assim que o convite for aceito, você será
          redirecionado automaticamente para a área do seu time.
        </p>
        <form action={signOut}>
          <Button type="submit" variant="secondary">
            Sair
          </Button>
        </form>
      </Card>
    </main>
  );
}
