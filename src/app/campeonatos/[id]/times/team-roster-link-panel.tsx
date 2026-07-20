"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Input } from "@/components/ui";
import {
  getTeamRosterLink,
  getTeamRosterStatus,
  regenerateTeamRosterLink,
} from "./actions";

export function TeamRosterLinkPanel({ teamId }: { teamId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<{ playerCount: number; submitted: boolean } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTeamRosterLink(teamId), getTeamRosterStatus(teamId)]).then(
      ([linkResult, statusResult]) => {
        if (cancelled) return;
        if (!linkResult.ok) {
          setError(linkResult.error);
          return;
        }
        if (!statusResult.ok) {
          setError(statusResult.error);
          return;
        }
        setLink(linkResult.data);
        setStatus(statusResult.data);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar o link. Selecione e copie manualmente.");
    }
  }

  async function regenerate() {
    if (
      !window.confirm(
        "Isso invalida o link atual e reabre o cadastro para edição — quem já tiver salvo o link antigo não vai mais conseguir usá-lo. Continuar?"
      )
    ) {
      return;
    }
    setRegenerating(true);
    const result = await regenerateTeamRosterLink(teamId);
    if (result.ok) {
      setLink(result.data);
      setStatus({ playerCount: status?.playerCount ?? 0, submitted: false });
    } else {
      setError(result.error);
    }
    setRegenerating(false);
  }

  return (
    <div className="rounded-lg border border-border bg-surface-2/40 p-4">
      <h3 className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-foreground">
        Link do elenco
      </h3>
      <p className="mb-3 text-xs text-muted">
        Envie este link para o responsável pelo time cadastrar os jogadores (até
        20, nome completo/documento/posição obrigatórios) e o técnico. Ele pode
        salvar e voltar depois; ao clicar em &quot;Enviar&quot;, o cadastro é
        travado e não pode mais ser editado.
      </p>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Input value={link ?? "Gerando link..."} readOnly className="max-w-sm" />
        <Button type="button" variant="secondary" onClick={copyLink} disabled={!link}>
          {copied ? "Copiado!" : "Copiar link"}
        </Button>
        <Button type="button" variant="ghost" onClick={regenerate} disabled={regenerating}>
          {regenerating ? "Gerando…" : "Gerar novo link"}
        </Button>
        {status && (
          <Badge tone={status.submitted ? "success" : "warning"}>
            {status.submitted
              ? `Enviado · ${status.playerCount} jogador(es)`
              : `Em preenchimento · ${status.playerCount} jogador(es)`}
          </Badge>
        )}
      </div>
    </div>
  );
}
