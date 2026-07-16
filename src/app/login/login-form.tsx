"use client";

import { useActionState, useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import {
  type AuthState,
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from "./actions";

type Mode = "signin" | "signup" | "magic";

const initialAuthState: AuthState = { error: null, info: null };

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");

  const [signInState, signInAction, signInPending] = useActionState(
    signInWithPassword,
    initialAuthState
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUpWithPassword,
    initialAuthState
  );
  const [magicState, magicAction, magicPending] = useActionState(
    signInWithMagicLink,
    initialAuthState
  );

  const tabs: { id: Mode; label: string }[] = [
    { id: "signin", label: "Entrar" },
    { id: "signup", label: "Criar conta" },
    { id: "magic", label: "Link mágico" },
  ];

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex rounded-lg border border-border bg-surface-2 p-1 text-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`flex-1 rounded-md px-2 py-1.5 font-medium transition ${
              mode === tab.id
                ? "bg-accent text-[#06110a]"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "signin" && (
        <form action={signInAction} className="space-y-4">
          <div>
            <Label>E-mail</Label>
            <Input type="email" name="email" required placeholder="voce@email.com" />
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" name="password" required placeholder="••••••••" />
          </div>
          {signInState.error && (
            <p className="text-sm text-danger">{signInState.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={signInPending}>
            {signInPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      )}

      {mode === "signup" && (
        <form action={signUpAction} className="space-y-4">
          <div>
            <Label>E-mail</Label>
            <Input type="email" name="email" required placeholder="voce@email.com" />
          </div>
          <div>
            <Label>Senha</Label>
            <Input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="mínimo 6 caracteres"
            />
          </div>
          {signUpState.error && (
            <p className="text-sm text-danger">{signUpState.error}</p>
          )}
          {signUpState.info && (
            <p className="text-sm text-accent">{signUpState.info}</p>
          )}
          <Button type="submit" className="w-full" disabled={signUpPending}>
            {signUpPending ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      )}

      {mode === "magic" && (
        <form action={magicAction} className="space-y-4">
          <div>
            <Label>E-mail</Label>
            <Input type="email" name="email" required placeholder="voce@email.com" />
          </div>
          {magicState.error && (
            <p className="text-sm text-danger">{magicState.error}</p>
          )}
          {magicState.info && (
            <p className="text-sm text-accent">{magicState.info}</p>
          )}
          <Button type="submit" className="w-full" disabled={magicPending}>
            {magicPending ? "Enviando..." : "Enviar link mágico"}
          </Button>
        </form>
      )}
    </div>
  );
}
