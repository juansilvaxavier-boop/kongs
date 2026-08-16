import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PushSubscribeButton } from "@/components/push-subscribe-button";
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
    supabase.from("championships").select("id, name, logo_url").eq("id", id).maybeSingle(),
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

  const hasSponsors = (sponsors ?? []).some((s) => s.logo_url);

  return (
    <div className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={`/campeonato/${id}`} className="flex items-center gap-2">
            {championship.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={championship.logo_url}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <BrandMark />
            )}
            <span className="font-display text-lg font-bold uppercase tracking-wide">
              {championship.name}
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SocialLinks />
            <ThemeToggle />
            {user && (
              <Link
                href="/favoritos"
                title="Meus favoritos"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 text-muted transition hover:border-accent/60 hover:text-foreground sm:px-3"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
                  <path d="m12 2 2.9 6.26L21.5 9l-5 4.87L17.8 21 12 17.77 6.2 21l1.3-7.13-5-4.87 6.6-.74Z" />
                </svg>
                <span className="hidden text-sm font-medium sm:inline">Favoritos</span>
              </Link>
            )}
            <PushSubscribeButton championshipId={id} />
            <ShareButton title={championship.name} />
          </div>
        </div>
      </header>
      <main
        className={`mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-start md:gap-8 md:pb-8 ${
          hasSponsors && user ? "pb-40" : hasSponsors || user ? "pb-24" : ""
        }`}
      >
        {user && <SidebarNav sponsors={sponsors ?? []} />}
        <div className="min-w-0 flex-1">
          <PublicChampionshipTabs id={id} />
          {children}
        </div>
      </main>
      <SponsorsFooter sponsors={sponsors ?? []} />
    </div>
  );
}
