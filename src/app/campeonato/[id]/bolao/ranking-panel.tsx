"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Button, Card, EmptyState } from "@/components/ui";

export type RankingRow = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  isMe: boolean;
  exactCount: number;
  correctCount: number;
  groupExactCount: number;
  topscorerHit: boolean;
  championHit: boolean;
  points: number;
  detail: ReactNode;
};

export function RankingPanel({ rows }: { rows: RankingRow[] }) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const openRow = rows.find((row) => row.userId === openUserId) ?? null;

  if (rows.length === 0) {
    return <EmptyState>Ninguém palpitou ainda.</EmptyState>;
  }

  return (
    <>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
              <th className="w-10 px-4 py-3">#</th>
              <th className="px-4 py-3">Torcedor</th>
              <th className="px-4 py-3 text-center">Cravadas</th>
              <th className="px-4 py-3 text-center">Acertos</th>
              <th className="px-4 py-3 text-center">Posições</th>
              <th className="px-4 py-3 text-center">Artilheiro</th>
              <th className="px-4 py-3 text-center">Campeão</th>
              <th className="px-4 py-3 text-center">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.userId}
                onClick={() => setOpenUserId(row.userId)}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-2/40"
              >
                <td className="px-4 py-3 text-muted">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {row.avatarUrl ? (
                      <span className="relative h-7 w-7 shrink-0">
                        <Image
                          src={row.avatarUrl}
                          alt=""
                          fill
                          loading="eager"
                          sizes="28px"
                          className="rounded-full object-cover"
                        />
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">
                        {row.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="font-medium text-foreground underline decoration-dotted underline-offset-4">
                      {row.name}
                      {row.isMe ? " (você)" : ""}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-foreground">{row.exactCount}</td>
                <td className="px-4 py-3 text-center text-foreground">{row.correctCount}</td>
                <td className="px-4 py-3 text-center text-foreground">{row.groupExactCount}</td>
                <td className="px-4 py-3 text-center text-foreground">{row.topscorerHit ? "✓" : "—"}</td>
                <td className="px-4 py-3 text-center text-foreground">{row.championHit ? "✓" : "—"}</td>
                <td className="px-4 py-3 text-center font-display text-base font-semibold text-accent">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {openRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpenUserId(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
                Palpites de {openRow.name}
              </h2>
              <Button variant="secondary" onClick={() => setOpenUserId(null)}>
                Fechar
              </Button>
            </div>
            <div className="overflow-y-auto p-4">{openRow.detail}</div>
          </div>
        </div>
      )}
    </>
  );
}
