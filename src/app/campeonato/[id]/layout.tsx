import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShareButton } from "@/components/share-button";
import { BrandMark } from "@/components/ui";

export default async function PublicChampionshipLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: championship } = await supabase
    .from("championships")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!championship) notFound();

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
            <ShareButton title={championship.name} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
