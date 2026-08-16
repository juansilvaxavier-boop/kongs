"use client";

import { AppSidebar, type SidebarSponsor } from "@/components/app-sidebar";
import { IconSettings, IconStar, IconTrophy, IconUser } from "@/components/icons";

export function SidebarNav({ sponsors }: { sponsors?: SidebarSponsor[] }) {
  return (
    <AppSidebar
      homeHref="/inicio"
      homeLabel="Kongs"
      links={[
        { href: "/inicio", label: "Campeonatos", icon: <IconTrophy className="h-full w-full" /> },
        { href: "/favoritos", label: "Favoritos", icon: <IconStar className="h-full w-full" /> },
      ]}
      bottomLinks={[
        { href: "/inicio/perfil", label: "Perfil", icon: <IconUser className="h-full w-full" /> },
        {
          href: "/inicio/configuracoes",
          label: "Configurações",
          icon: <IconSettings className="h-full w-full" />,
        },
      ]}
      sponsors={sponsors}
    />
  );
}
