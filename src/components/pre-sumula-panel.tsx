"use client";

import { useState } from "react";
import { Card } from "./ui";
import { SignaturePad } from "./signature-pad";
import { useToast } from "./toast-provider";
import type { ActionResult } from "@/lib/action-result";

type Player = { id: string; name: string; team_id: string | null };
export type CaptainSignature = {
  captainName: string;
  signatureDataUrl: string;
  signedAt: string;
};

function TeamLineupColumn({
  teamName,
  teamPlayers,
  confirmedPlayerIds,
  onToggle,
  shirtNumberEdits,
  onShirtNumberChange,
  signature,
  onSignCaptain,
}: {
  teamName: string;
  teamPlayers: Player[];
  confirmedPlayerIds: Set<string>;
  onToggle: (playerId: string, confirmed: boolean) => Promise<ActionResult>;
  shirtNumberEdits: Record<string, string>;
  onShirtNumberChange: (playerId: string, value: string) => void;
  signature: CaptainSignature | null;
  onSignCaptain: (captainName: string, signatureDataUrl: string) => Promise<ActionResult>;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [resigning, setResigning] = useState(false);
  const [captainName, setCaptainName] = useState(signature?.captainName ?? "");
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const showForm = !signature || resigning;

  return (
    <Card className="p-3">
      <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
        {teamName}
      </h4>

      {teamPlayers.length === 0 ? (
        <p className="text-sm text-muted">Nenhum jogador cadastrado neste time.</p>
      ) : (
        <ul className="mb-4 space-y-1.5">
          {teamPlayers.map((player) => {
            const confirmed = confirmedPlayerIds.has(player.id);
            return (
              <li key={player.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-foreground">{player.name}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-muted">
                    Nº
                    <input
                      type="number"
                      min={0}
                      max={999}
                      placeholder="—"
                      value={shirtNumberEdits[player.id] ?? ""}
                      onChange={(event) => onShirtNumberChange(player.id, event.target.value)}
                      className="w-14 rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-foreground"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      disabled={pendingId === player.id}
                      onChange={async (event) => {
                        setPendingId(player.id);
                        const result = await onToggle(player.id, event.target.checked);
                        if (!result.ok) toast.error(result.error);
                        setPendingId(null);
                      }}
                    />
                    Confirmado
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-border pt-3">
        <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
          Assinatura do responsável
        </h5>
        {!showForm && signature ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signature.signatureDataUrl}
              alt=""
              className="h-16 rounded border border-border bg-white"
            />
            <div className="text-sm">
              <p className="font-medium text-foreground">{signature.captainName}</p>
              <p className="text-xs text-muted">
                Assinado em {new Date(signature.signedAt).toLocaleString("pt-BR")}
              </p>
              <button
                type="button"
                className="text-xs text-muted underline hover:text-accent"
                onClick={() => setResigning(true)}
              >
                Assinar novamente
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="text"
              placeholder="Nome do capitão"
              value={captainName}
              onChange={(event) => setCaptainName(event.target.value)}
              className="mb-2 w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground"
            />
            {error && <p className="mb-2 text-xs text-danger">{error}</p>}
            <SignaturePad
              pending={signing}
              onSave={async (dataUrl) => {
                if (!captainName.trim()) {
                  setError("Informe o nome do capitão.");
                  return;
                }
                setError(null);
                setSigning(true);
                const result = await onSignCaptain(captainName.trim(), dataUrl);
                if (result.ok) {
                  setResigning(false);
                } else {
                  setError(result.error);
                }
                setSigning(false);
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export function PreSumulaPanel({
  teamAId,
  teamAName,
  teamBId,
  teamBName,
  players,
  confirmedPlayerIds,
  shirtNumberEdits,
  onShirtNumberChange,
  signatures,
  onToggleLineup,
  onSignCaptain,
}: {
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  players: Player[];
  confirmedPlayerIds: Set<string>;
  shirtNumberEdits: Record<string, string>;
  onShirtNumberChange: (playerId: string, value: string) => void;
  signatures: Record<string, CaptainSignature>;
  onToggleLineup: (playerId: string, confirmed: boolean) => Promise<ActionResult>;
  onSignCaptain: (
    teamId: string,
    captainName: string,
    signatureDataUrl: string
  ) => Promise<ActionResult>;
}) {
  const teamAPlayers = players.filter((p) => p.team_id === teamAId);
  const teamBPlayers = players.filter((p) => p.team_id === teamBId);

  return (
    <div className="mb-6">
      <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
        Pré-súmula
      </h3>
      <p className="mb-3 text-xs text-muted">
        Confirme os jogadores que vão participar da partida e colete a assinatura dos capitães
        antes de iniciar o jogo.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamLineupColumn
          teamName={teamAName}
          teamPlayers={teamAPlayers}
          confirmedPlayerIds={confirmedPlayerIds}
          onToggle={onToggleLineup}
          shirtNumberEdits={shirtNumberEdits}
          onShirtNumberChange={onShirtNumberChange}
          signature={signatures[teamAId] ?? null}
          onSignCaptain={(name, dataUrl) => onSignCaptain(teamAId, name, dataUrl)}
        />
        <TeamLineupColumn
          teamName={teamBName}
          teamPlayers={teamBPlayers}
          confirmedPlayerIds={confirmedPlayerIds}
          onToggle={onToggleLineup}
          shirtNumberEdits={shirtNumberEdits}
          onShirtNumberChange={onShirtNumberChange}
          signature={signatures[teamBId] ?? null}
          onSignCaptain={(name, dataUrl) => onSignCaptain(teamBId, name, dataUrl)}
        />
      </div>
    </div>
  );
}
