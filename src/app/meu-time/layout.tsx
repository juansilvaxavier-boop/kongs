import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnedTeam, getUserPermissions, isAdmin } from "@/lib/auth/roles";
import { resolveAuthenticatedDestination } from "@/lib/auth/destination";
import { signOut } from "@/app/login/actions";
import { BrandMark, Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { SwitchProfileLink } from "@/components/switch-profile-link";

export default async function MeuTimeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const team = await getOwnedTeam(supabase, user.id);
  if (!team) {
    redirect(await resolveAuthenticatedDestination(supabase));
  }

  const admin = await isAdmin(supabase);
  const permissions = admin ? [] : await getUserPermissions(supabase);
  const canManage = admin || permissions.length > 0;

  return (
    <div className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/meu-time" className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-bold uppercase tracking-wide">
              {team.name}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">
              {user.email}
            </span>
            <Link href="/meu-time/conta" className="text-sm text-muted hover:text-accent">
              Minha conta
            </Link>
            {canManage && <SwitchProfileLink href="/campeonatos" label="Entrar como gestor" />}
            <ThemeToggle />
            <form action={signOut}>
              <Button type="submit" variant="secondary">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
