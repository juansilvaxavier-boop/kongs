"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui";

const TABS = [
  { href: "/inicio", label: "Campeonatos" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/inicio/perfil", label: "Perfil" },
  { href: "/inicio/configuracoes", label: "Configurações" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar -mx-4 flex items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0 md:w-48 md:shrink-0 md:items-stretch md:flex-col md:overflow-visible">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition md:w-full ${
              active
                ? "bg-surface-2 text-accent"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      <form action={signOut} className="shrink-0 md:mt-2 md:w-full">
        <Button type="submit" variant="secondary" className="whitespace-nowrap md:w-full">
          Sair
        </Button>
      </form>
    </nav>
  );
}
