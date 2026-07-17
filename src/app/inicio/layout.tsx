import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "@/components/ui";
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

  return (
    <div className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-bold uppercase tracking-wide">
              Kongs Campeonatos
            </span>
          </span>
          <span className="hidden text-sm text-muted sm:inline">
            {user.email}
          </span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 gap-8 px-4 py-8 sm:px-6">
        <SidebarNav />
        <div className="min-w-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
