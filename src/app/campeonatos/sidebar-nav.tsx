"use client";

import { AppSidebar } from "@/components/app-sidebar";

export function AdminSidebarNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <AppSidebar
      homeHref="/campeonatos"
      homeLabel="Kongs Admin"
      links={[
        { href: "/campeonatos", label: "Campeonatos" },
        ...(isAdmin ? [{ href: "/campeonatos/usuarios", label: "Usuários" }] : []),
        ...(isAdmin ? [{ href: "/campeonatos/auditoria", label: "Auditoria" }] : []),
      ]}
      bottomLinks={[{ href: "/campeonatos/configuracoes", label: "Configurações" }]}
    />
  );
}
