import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShareButton } from "@/components/share-button";
import { SocialLinks } from "@/components/social-links";
import { SponsorsFooter } from "@/components/sponsors-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/ui";
import { SidebarNav } from "@/app/inicio/sidebar-nav";
import { PublicChampionshipTabs } from "./public-tabs";

export default async function PublicChampionshipLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: sponsors }] = await Promise.all([
    supabase.from("championships").select("id, name").eq("id", id).maybeSingle(),
    supabase
      .from("sponsors")
      .select("id, name, logo_url, link_url")
      .eq("championship_id", id)
      .order("created_at"),
  ]);

  if (!championship) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={`/campeonato/${id}`} className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-bold uppercase tracking-wide">
              {championship.name}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs uppercase tracking-wide text-muted sm:inline">
              Página pública
            </span>
            <SocialLinks />
            <ThemeToggle />
            <ShareButton title={championship.name} />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:gap-8">
        {user && <SidebarNav />}
        <div className="min-w-0 flex-1">
          <PublicChampionshipTabs id={id} />
          {children}
        </div>
      </main>
      <SponsorsFooter sponsors={sponsors ?? []} />
    </div>
  );
}
