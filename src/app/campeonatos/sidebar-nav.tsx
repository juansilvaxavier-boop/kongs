"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { IconClipboard, IconSettings, IconTrophy, IconUsers } from "@/components/icons";

export function AdminSidebarNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <AppSidebar
      homeHref="/campeonatos"
      homeLabel="Kongs Admin"
      links={[
        { href: "/campeonatos", label: "Campeonatos", icon: <IconTrophy className="h-full w-full" /> },
        ...(isAdmin
          ? [{ href: "/campeonatos/usuarios", label: "Usuários", icon: <IconUsers className="h-full w-full" /> }]
          : []),
        ...(isAdmin
          ? [
              {
                href: "/campeonatos/auditoria",
                label: "Auditoria",
                icon: <IconClipboard className="h-full w-full" />,
              },
            ]
          : []),
      ]}
      bottomLinks={[
        {
          href: "/campeonatos/configuracoes",
          label: "Configurações",
          icon: <IconSettings className="h-full w-full" />,
        },
      ]}
    />
  );
}
