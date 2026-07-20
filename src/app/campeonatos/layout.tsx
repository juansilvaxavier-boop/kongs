import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPermissions, isAdmin } from "@/lib/auth/roles";
import { resolveAuthenticatedDestination } from "@/lib/auth/destination";
import { BrandMark } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminSidebarNav } from "./sidebar-nav";

export default async function CampeonatosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const admin = await isAdmin(supabase);
  const permissions = admin ? [] : await getUserPermissions(supabase);
  if (!admin && permissions.length === 0) {
    redirect(await resolveAuthenticatedDestination(supabase));
  }

  return (
    <div className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/campeonatos" className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-bold uppercase tracking-wide">
              Kongs Campeonatos
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">
              {user.email}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:gap-8">
        <AdminSidebarNav isAdmin={admin} />
        <div className="min-w-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
