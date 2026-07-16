"use client";

import { Button, Card } from "@/components/ui";

export default function CampeonatosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="max-w-md p-6 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-danger">
          Ops
        </p>
        <h1 className="mb-3 font-display text-xl font-bold uppercase tracking-wide text-foreground">
          Não foi possível concluir a ação
        </h1>
        <p className="mb-5 text-sm text-muted">{error.message}</p>
        <Button onClick={reset}>Tentar novamente</Button>
      </Card>
    </div>
  );
}
