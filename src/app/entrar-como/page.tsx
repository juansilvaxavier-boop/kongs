import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, getUserPermissions } from "@/lib/auth/roles";
import { resolveRegularDestination } from "@/lib/auth/destination";
import { BrandMark, Card } from "@/components/ui";

export default async function EntrarComoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (await isAdmin(supabase)) redirect("/campeonatos");

  const permissions = await getUserPermissions(supabase);
  if (permissions.length === 0) {
    redirect(await resolveRegularDestination(supabase));
  }

  const regularDestination = await resolveRegularDestination(supabase);

  return (
    <main className="pitch-lines flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <BrandMark size="lg" />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          Bem-vindo de volta
        </p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
          Como você quer entrar?
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Sua conta tem acesso de gestão. Escolha se quer entrar no painel de
          administração ou na experiência normal de usuário.
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/campeonatos">
          <Card className="flex h-full flex-col gap-2 p-6 text-left transition hover:border-accent/60">
            <span className="text-2xl">🛠️</span>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
              Gestor do campeonato
            </h2>
            <p className="text-sm text-muted">
              Acesse o painel administrativo: campeonatos, times, jogos,
              financeiro e patrocinadores.
            </p>
          </Card>
        </Link>

        <Link href={regularDestination}>
          <Card className="flex h-full flex-col gap-2 p-6 text-left transition hover:border-accent/60">
            <span className="text-2xl">⚽</span>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
              Usuário
            </h2>
            <p className="text-sm text-muted">
              Acompanhe campeonatos como torcedor: favoritos, bolão,
              comentários e comparadores.
            </p>
          </Card>
        </Link>
      </div>
    </main>
  );
}
