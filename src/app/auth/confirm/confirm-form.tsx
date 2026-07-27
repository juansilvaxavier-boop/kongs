"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Button, Card } from "@/components/ui";
import { confirmAuthLink } from "./actions";

export function ConfirmForm({
  tokenHash,
  type,
  next,
}: {
  tokenHash: string;
  type: EmailOtpType;
  next: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmAuthLink(tokenHash, type, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.data.redirectTo);
    });
  }

  if (error) {
    return (
      <Card className="w-full max-w-sm space-y-3 p-6 text-center">
        <p className="text-sm text-danger">{error}</p>
        <Link href="/login" className="text-sm text-accent hover:underline">
          Voltar para o login
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm space-y-4 p-6 text-center">
      <p className="text-sm text-muted">
        Por segurança, confirme clicando no botão abaixo para continuar.
      </p>
      <Button className="w-full" onClick={handleConfirm} disabled={pending}>
        {pending ? "Confirmando…" : "Confirmar"}
      </Button>
    </Card>
  );
}
