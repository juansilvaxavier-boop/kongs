"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { BrandMark } from "@/components/ui";

export type SidebarLink = { href: string; label: string };

function NavLink({ href, label, active }: SidebarLink & { active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-surface-2 text-accent" : "text-muted hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

/**
 * Shell de navegação do app: barra horizontal rolável no mobile, painel
 * fixo (sticky) à esquerda no desktop — logo no topo, navegação principal
 * no meio, perfil/configurações/sair no rodapé do painel.
 */
export function AppSidebar({
  homeHref,
  homeLabel,
  links,
  bottomLinks = [],
}: {
  homeHref: string;
  homeLabel: string;
  links: SidebarLink[];
  bottomLinks?: SidebarLink[];
}) {
  const pathname = usePathname();
  const allLinks = [...links, ...bottomLinks];

  return (
    <>
      <nav className="no-scrollbar -mx-4 mb-4 flex items-center gap-1 overflow-x-auto border-b border-border px-4 pb-3 md:hidden">
        {allLinks.map((link) => (
          <div key={link.href} className="shrink-0">
            <NavLink {...link} active={pathname === link.href} />
          </div>
        ))}
        <form action={signOut} className="shrink-0">
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-danger"
          >
            Sair
          </button>
        </form>
      </nav>

      <aside className="sticky top-20 hidden h-[calc(100dvh-6rem)] w-56 shrink-0 flex-col justify-between rounded-xl border border-border bg-surface/80 p-4 shadow-lg shadow-black/20 backdrop-blur md:flex">
        <div className="flex flex-col gap-6">
          <Link href={homeHref} className="flex items-center gap-2 px-1">
            <BrandMark />
            <span className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
              {homeLabel}
            </span>
          </Link>
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink key={link.href} {...link} active={pathname === link.href} />
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-1 border-t border-border pt-3">
          {bottomLinks.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-danger"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
