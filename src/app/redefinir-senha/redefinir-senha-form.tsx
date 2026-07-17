"use client";

import { useActionState } from "react";
import { Button, Label } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
import { updatePassword, type UpdatePasswordState } from "./actions";

const initialState: UpdatePasswordState = { error: null };

export function RedefinirSenhaForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={action} className="w-full max-w-sm space-y-4">
      <div>
        <Label>Nova senha</Label>
        <PasswordInput
          name="password"
          required
          minLength={6}
          placeholder="mínimo 6 caracteres"
        />
      </div>
      <div>
        <Label>Confirme a nova senha</Label>
        <PasswordInput name="confirmPassword" required minLength={6} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
