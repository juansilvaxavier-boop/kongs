"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Select } from "@/components/ui";

const TABS = [
  { slug: "classificacao", label: "Classificação" },
  { slug: "jogos", label: "Jogos" },
  { slug: "times", label: "Times" },
  { slug: "estatisticas", label: "Estatísticas" },
  { slug: "configuracoes", label: "Configurações" },
];

export function ChampionshipTabs({ id }: { id: string }) {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-border">
      {TABS.map((tab) => {
        const href = `/campeonatos/${id}/${tab.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.slug}
            href={href}
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
