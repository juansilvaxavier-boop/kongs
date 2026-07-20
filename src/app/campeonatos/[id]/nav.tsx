"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Select } from "@/components/ui";

const TABS = [
  { slug: "classificacao", label: "Classificação" },
  { slug: "jogos", label: "Jogos" },
  { slug: "times", label: "Times" },
  { slug: "estatisticas", label: "Estatísticas" },
  { slug: "financeiro", label: "Financeiro" },
  { slug: "configuracoes", label: "Configurações" },
];

export function ChampionshipTabs({ id }: { id: string }) {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      {TABS.map((tab) => {
        const href = `/campeonatos/${id}/${tab.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.slug}
            href={href}
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

export function ChampionshipSwitcher({
  id,
  items,
}: {
  id: string;
  items: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentTab = pathname.split("/")[3] ?? "classificacao";

  return (
    <Select
      value={id}
      className="max-w-xs"
      onChange={(event) => {
        router.push(`/campeonatos/${event.target.value}/${currentTab}`);
      }}
    >
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </Select>
  );
}
