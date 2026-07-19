"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { slug: "visao-geral", label: "Visão Geral" },
  { slug: "classificacao", label: "Classificação" },
  { slug: "partidas", label: "Partidas" },
  { slug: "estatisticas", label: "Estatísticas" },
  { slug: "bolao", label: "Bolão" },
];

export function PublicChampionshipTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <nav className="no-scrollbar -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      {TABS.map((tab) => {
        const href = `/campeonato/${id}/${tab.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.slug}
            href={query ? `${href}?${query}` : href}
            className={`shrink-0 whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium transition sm:px-4 ${
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
