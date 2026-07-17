"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui";

const TABS = [
  { href: "/inicio", label: "Campeonatos" },
  { href: "/inicio/perfil", label: "Perfil" },
  { href: "/inicio/configuracoes", label: "Configurações" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-48 shrink-0 flex-col gap-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-surface-2 text-accent"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      <form action={signOut} className="mt-2">
        <Button type="submit" variant="secondary" className="w-full">
          Sair
        </Button>
      </form>
    </nav>
  );
}
