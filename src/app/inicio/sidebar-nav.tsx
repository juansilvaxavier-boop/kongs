"use client";

import { AppSidebar } from "@/components/app-sidebar";

export function SidebarNav() {
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
    />
  );
}
