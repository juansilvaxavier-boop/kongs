"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, EmptyState, Select } from "@/components/ui";

export type ComparableTeam = {
  teamId: string;
  teamName: string;
  teamCrestUrl: string | null;
  pts: number;
  j: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
};

const STAT_ROWS: [keyof ComparableTeam, string][] = [
  ["pts", "Pontos"],
  ["j", "Jogos"],
  ["v", "Vitórias"],
  ["e", "Empates"],
  ["d", "Derrotas"],
  ["gp", "Gols pró"],
  ["gc", "Gols contra"],
  ["sg", "Saldo de gols"],
];

function TeamHeader({ team }: { team: ComparableTeam }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {team.teamCrestUrl ? (
        <span className="relative h-16 w-16 shrink-0">
          <Image src={team.teamCrestUrl} alt="" fill loading="eager" sizes="64px" className="rounded-full object-cover" />
        </span>
      ) : (
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-muted">
          {team.teamName.slice(0, 2).toUpperCase()}
        </span>
      )}
      <p className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
        {team.teamName}
      </p>
    </div>
  );
}

export function TeamComparator({ teams }: { teams: ComparableTeam[] }) {
  const [aId, setAId] = useState(teams[0]?.teamId ?? "");
  const [bId, setBId] = useState(teams[1]?.teamId ?? teams[0]?.teamId ?? "");

  if (teams.length < 2) {
    return <EmptyState>Cadastre ao menos dois times para comparar.</EmptyState>;
  }

  const teamA = teams.find((t) => t.teamId === aId) ?? teams[0];
  const teamB = teams.find((t) => t.teamId === bId) ?? teams[1];

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-4">
        <Select value={teamA.teamId} onChange={(event) => setAId(event.target.value)}>
          {teams.map((t) => (
            <option key={t.teamId} value={t.teamId}>
              {t.teamName}
            </option>
          ))}
        </Select>
        <Select value={teamB.teamId} onChange={(event) => setBId(event.target.value)}>
          {teams.map((t) => (
            <option key={t.teamId} value={t.teamId}>
              {t.teamName}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-5 flex flex-wrap items-start justify-center gap-6">
        <TeamHeader team={teamA} />
        <TeamHeader team={teamB} />
      </div>

      <Card className="mx-auto max-w-md overflow-hidden">
        {STAT_ROWS.map(([key, label]) => {
          const aValue = teamA[key] as number;
          const bValue = teamB[key] as number;
          const aWins = aValue > bValue;
          const bWins = bValue > aValue;
          return (
            <div
              key={key}
              className="grid grid-cols-3 items-center border-b border-border px-3 py-2 text-sm last:border-0"
            >
              <span
                className={`text-right font-display font-semibold ${aWins ? "text-accent" : "text-foreground"}`}
              >
                {aValue}
              </span>
              <span className="text-center text-xs uppercase tracking-wide text-muted">
                {label}
              </span>
              <span
                className={`text-left font-display font-semibold ${bWins ? "text-accent" : "text-foreground"}`}
              >
                {bValue}
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
