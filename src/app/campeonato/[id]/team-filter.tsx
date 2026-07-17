"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui";

export function TeamFilter({ teams }: { teams: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("time") ?? "";

  return (
    <Select
      value={current}
      className="max-w-xs"
      onChange={(event) => {
        const params = new URLSearchParams(searchParams.toString());
        if (event.target.value) params.set("time", event.target.value);
        else params.delete("time");
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    >
      <option value="">Todos os times</option>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}
        </option>
      ))}
    </Select>
  );
}
