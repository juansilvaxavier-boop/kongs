"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { BrandMark } from "@/components/ui";
import { IconClose, IconLogout, IconMenu } from "@/components/icons";

export type SidebarLink = { href: string; label: string; icon?: ReactNode };
export type SidebarSponsor = {
  id: string;
  name: string;
  logo_url: string | null;
  link_url: string | null;
};

function NavLink({ href, label, icon, active }: SidebarLink & { active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-surface-2 text-accent" : "text-muted hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      {icon && <span className="h-4 w-4 shrink-0">{icon}</span>}
      {label}
    </Link>
  );
}

/**
 * Barra de abas fixa no rodapé (mobile) — cada destino principal vira uma
 * aba com ícone, do jeito que apps nativos fazem, em vez de uma faixa
 * rolável horizontal onde os últimos itens ficam fora da tela sem nenhuma
 * pista visual de que dá pra rolar (o que lia como "botão sumiu").
 * Itens secundários (bottomLinks + sair) ficam atrás do botão "Mais".
 */
function MobileTabBar({
  links,
  moreOpen,
  onToggleMore,
  activePath,
  offsetForSponsors,
}: {
  links: SidebarLink[];
  moreOpen: boolean;
  onToggleMore: () => void;
  activePath: string;
  offsetForSponsors: boolean;
}) {
  return (
    <nav
      className="fixed inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden"
      style={{
        bottom: offsetForSponsors ? "4rem" : 0,
        paddingBottom: offsetForSponsors ? undefined : "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${links.length + 1}, minmax(0, 1fr))` }}
      >
        {links.map((link) => {
          const active = activePath === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <span className="h-5 w-5">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onToggleMore}
          className={`flex flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium ${
            moreOpen ? "text-accent" : "text-muted"
          }`}
        >
          <span className="h-5 w-5">
            <IconMenu className="h-5 w-5" />
          </span>
          Mais
        </button>
      </div>
    </nav>
  );
}

function MoreSheet({
  open,
  onClose,
  bottomLinks,
  activePath,
}: {
  open: boolean;
  onClose: () => void;
  bottomLinks: SidebarLink[];
  activePath: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 md:hidden" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl border-t border-border bg-surface p-4 shadow-2xl"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
            Mais opções
          </span>
          <button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {bottomLinks.map((link) => (
            <NavLink key={link.href} {...link} active={activePath === link.href} />
          ))}
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-danger"
            >
              <IconLogout className="h-4 w-4 shrink-0" />
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Shell de navegação do app: no mobile, barra de abas fixa no rodapé +
 * botão "Mais" (menu de 3 linhas) pros itens secundários — no desktop,
 * painel fixo (sticky) à esquerda com tudo visível de uma vez.
 */
export function AppSidebar({
  homeHref,
  homeLabel,
  links,
  bottomLinks = [],
  sponsors = [],
}: {
  homeHref: string;
  homeLabel: string;
  links: SidebarLink[];
  bottomLinks?: SidebarLink[];
  sponsors?: SidebarSponsor[];
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const sponsorsWithLogo = sponsors.filter((s) => s.logo_url);

  return (
    <>
      {sponsorsWithLogo.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-4 flex items-center gap-3 overflow-x-auto border-b border-border px-4 pb-3 md:hidden">
          {sponsorsWithLogo.map((sponsor) => {
            const logo = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sponsor.logo_url!}
                alt={sponsor.name}
                title={sponsor.name}
                className="h-8 w-8 shrink-0 rounded object-contain"
              />
            );
            return sponsor.link_url ? (
              <a key={sponsor.id} href={sponsor.link_url} target="_blank" rel="noopener noreferrer nofollow">
                {logo}
              </a>
            ) : (
              <span key={sponsor.id}>{logo}</span>
            );
          })}
        </div>
      )}

      <MobileTabBar
        links={links}
        moreOpen={moreOpen}
        onToggleMore={() => setMoreOpen((v) => !v)}
        activePath={pathname}
        offsetForSponsors={sponsorsWithLogo.length > 0}
      />
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        bottomLinks={bottomLinks}
        activePath={pathname}
      />

      <aside className="sticky top-20 hidden h-[calc(100dvh-6rem)] w-56 shrink-0 flex-col justify-between rounded-xl border border-border bg-surface/80 p-4 shadow-lg shadow-black/20 backdrop-blur md:flex">
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
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

          {sponsorsWithLogo.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="mb-2 px-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
                Patrocinadores
              </p>
              <div className="flex flex-wrap gap-2 px-1">
                {sponsorsWithLogo.map((sponsor) => {
                  const logo = (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sponsor.logo_url!}
                      alt={sponsor.name}
                      title={sponsor.name}
                      className="h-9 w-9 rounded object-contain opacity-90 grayscale transition hover:opacity-100 hover:grayscale-0"
                    />
                  );
                  return sponsor.link_url ? (
                    <a
                      key={sponsor.id}
                      href={sponsor.link_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      {logo}
                    </a>
                  ) : (
                    <span key={sponsor.id}>{logo}</span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1 border-t border-border pt-3">
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
