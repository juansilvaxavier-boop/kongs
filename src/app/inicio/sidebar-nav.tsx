"use client";

import { AppSidebar, type SidebarSponsor } from "@/components/app-sidebar";

export function SidebarNav({ sponsors }: { sponsors?: SidebarSponsor[] }) {
  return (
    <AppSidebar
      homeHref="/inicio"
      homeLabel="Kongs"
      links={[
        { href: "/inicio", label: "Campeonatos" },
        { href: "/favoritos", label: "Favoritos" },
      ]}
      bottomLinks={[
        { href: "/inicio/perfil", label: "Perfil" },
        { href: "/inicio/configuracoes", label: "Configurações" },
      ]}
      sponsors={sponsors}
    />
  );
}
