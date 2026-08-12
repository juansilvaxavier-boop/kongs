"use client";

import { useRouter } from "next/navigation";
import { useToast } from "./toast-provider";
import type { ActionResult } from "@/lib/action-result";

/**
 * Chamar uma Server Action direto (fora de um <form action={serverAction}>
 * do React) não é coberto pelo tratamento de erro automático do Next —
 * qualquer rejeição (ex.: referência de Server Action expirada após um
 * novo deploy, falha de rede) vira uma promise não tratada: sem toast, sem
 * atualização de tela, o clique simplesmente parece não fazer nada. Este
 * hook padroniza o try/catch e o refresh pós-sucesso pra qualquer botão de
 * ação (excluir, aplicar, etc.) que chame uma Server Action diretamente.
 */
export function useDeleteAction() {
  const toast = useToast();
  const router = useRouter();

  return async function runDeleteAction<T>(action: () => Promise<ActionResult<T>>) {
    try {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    } catch {
      toast.error("Não foi possível concluir a ação. Atualize a página (F5) e tente novamente.");
    }
  };
}
