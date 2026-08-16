import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { SwitchProfileLink } from "@/components/switch-profile-link";
import { getAccessContext } from "@/lib/auth/roles";
import { SidebarNav } from "./sidebar-nav";

export default async function InicioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { canManage } = await getAccessContext(supabase);

  return (
    <div className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-sm text-muted">{user.email}</span>
          <div className="flex items-center gap-3">
            {canManage && <SwitchProfileLink href="/campeonatos" label="Entrar como gestor" />}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 pb-24 pt-8 sm:px-6 md:flex-row md:items-start md:gap-8 md:pb-8">
        <SidebarNav />
        <div className="min-w-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
