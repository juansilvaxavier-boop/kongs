"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { useConfirm } from "@/components/confirm-provider";
import { getChampionshipSumulaLink, regenerateChampionshipSumulaLink } from "./actions";

export function SumulaLinkSection({ championshipId }: { championshipId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    let cancelled = false;
    getChampionshipSumulaLink(championshipId).then((result) => {
      if (cancelled) return;
      if (result.ok) setLink(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [championshipId]);

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
    const ok = await confirm({
      title: "Gerar um novo link?",
      description:
        "Isso invalida o link atual — quem já tiver salvo o link antigo não vai mais conseguir preencher a súmula.",
      confirmLabel: "Gerar novo link",
    });
    if (!ok) {
      return;
    }
    setRegenerating(true);
    const result = await regenerateChampionshipSumulaLink(championshipId);
    if (result.ok) {
      setLink(result.data);
    } else {
      setError(result.error);
    }
    setRegenerating(false);
  }

  return (
    <Card className="mb-6 p-4">
      <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-foreground">
        Link da súmula
      </h2>
      <p className="mb-3 text-xs text-muted">
        Um único link para todo o campeonato — envie para os mesários. Ao abrir,
        eles escolhem o jogo numa lista e preenchem gols e cartões ao vivo, sem
        precisar de login.
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
      </div>
    </Card>
  );
}
