"use client";

import { useState } from "react";
import { Badge, Button, FileInput } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useDeleteAction } from "@/components/use-delete-action";
import { ContractPdfButton } from "./contract-pdf-button";
import { deleteTeamContract, getTeamContractSignedUrl, uploadTeamContract } from "./actions";

type RosterPlayer = {
  name: string;
  position: string | null;
  birth_date: string | null;
  document_type: string | null;
  document_number: string | null;
};

export function ContractPanel({
  championshipId,
  championshipName,
  teamId,
  teamName,
  crestUrl,
  coachName,
  players,
  contractUploadedAt,
}: {
  championshipId: string;
  championshipName: string;
  teamId: string;
  teamName: string;
  crestUrl: string | null;
  coachName: string | null;
  players: RosterPlayer[];
  contractUploadedAt: string | null;
}) {
  const [viewing, setViewing] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();
  const runDelete = useDeleteAction();

  async function handleView() {
    setViewing(true);
    try {
      const result = await getTeamContractSignedUrl(teamId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.open(result.data, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Não foi possível abrir o contrato. Atualize a página (F5) e tente novamente.");
    } finally {
      setViewing(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Remover o contrato enviado?",
      confirmLabel: "Remover",
      danger: true,
    });
    if (!ok) return;
    await runDelete(() => deleteTeamContract(teamId, championshipId));
  }

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Contrato</h3>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <ContractPdfButton
          championshipName={championshipName}
          teamName={teamName}
          crestUrl={crestUrl}
          coachName={coachName}
          players={players}
        />
        {contractUploadedAt ? (
          <>
            <Badge tone="success">
              Enviado em {new Date(contractUploadedAt).toLocaleDateString("pt-BR")}
            </Badge>
            <Button type="button" variant="secondary" disabled={viewing} onClick={handleView}>
              {viewing ? "Abrindo…" : "Ver contrato"}
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete}>
              Remover
            </Button>
          </>
        ) : (
          <Badge>Nenhum contrato enviado</Badge>
        )}
      </div>

      <ActionForm
        action={(formData) => uploadTeamContract(teamId, championshipId, formData)}
        className="flex flex-wrap items-end gap-2"
        successMessage="Contrato enviado!"
      >
        <FileInput name="contract" accept="application/pdf" className="max-w-[16rem]" />
        <SubmitButton pendingText="Enviando…">
          {contractUploadedAt ? "Enviar novo contrato" : "Enviar contrato assinado"}
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
