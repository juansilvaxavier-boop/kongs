"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { slug: "visao-geral", label: "Visão Geral" },
  { slug: "classificacao", label: "Classificação" },
  { slug: "partidas", label: "Partidas" },
  { slug: "estatisticas", label: "Estatísticas" },
];

export function PublicChampionshipTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-border">
      {TABS.map((tab) => {
        const href = `/campeonato/${id}/${tab.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.slug}
            href={query ? `${href}?${query}` : href}
            className={`rounded-t-md px-4 py-2 text-sm font-medium transition ${
              active
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
