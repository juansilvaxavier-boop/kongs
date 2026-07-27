"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useToast } from "@/components/toast-provider";
import { confirmRachaAttendance } from "../actions";

export function ConfirmAttendanceButton({
  championshipId,
  sessionId,
  confirmed,
}: {
  championshipId: string;
  sessionId: string;
  confirmed: boolean;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const toast = useToast();

  return (
    <Button
      type="button"
      variant={confirmed ? "secondary" : "primary"}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await confirmRachaAttendance(championshipId, sessionId, !confirmed);
        setPending(false);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        router.refresh();
      }}
    >
      {pending ? "Salvando…" : confirmed ? "Cancelar presença" : "Confirmar presença"}
    </Button>
  );
}
