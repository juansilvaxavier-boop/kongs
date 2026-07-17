"use client";

import { useActionState, useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
import {
  type AuthState,
  sendPasswordReset,
  signInWithGoogle,
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from "./actions";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

type Mode = "signin" | "signup" | "magic" | "recover";

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
  const [recoverState, recoverAction, recoverPending] = useActionState(
    sendPasswordReset,
    initialAuthState
  );

  const tabs: { id: Mode; label: string }[] = [
    { id: "signin", label: "Entrar" },
    { id: "signup", label: "Criar conta" },
    { id: "magic", label: "Link mágico" },
  ];

  return (
    <div className="w-full max-w-sm">
      {mode !== "recover" && (
        <div className="mb-6 flex rounded-lg border border-border bg-surface-2 p-1 text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`flex-1 rounded-md px-2 py-1.5 font-medium transition ${
                mode === tab.id
                  ? "brand-gradient-1 text-black"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {mode === "signin" && (
        <form action={signInAction} className="space-y-4">
          <div>
            <Label>E-mail</Label>
            <Input type="email" name="email" required placeholder="voce@email.com" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label>Senha</Label>
              <button
                type="button"
                onClick={() => setMode("recover")}
                className="text-xs text-muted hover:text-accent"
              >
                Esqueci minha senha
              </button>
            </div>
            <PasswordInput name="password" required placeholder="••••••••" />
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
            <PasswordInput
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

      {mode === "recover" && (
        <form action={recoverAction} className="space-y-4">
          <div>
            <Label>E-mail</Label>
            <Input type="email" name="email" required placeholder="voce@email.com" />
          </div>
          {recoverState.error && (
            <p className="text-sm text-danger">{recoverState.error}</p>
          )}
          {recoverState.info && (
            <p className="text-sm text-accent">{recoverState.info}</p>
          )}
          <Button type="submit" className="w-full" disabled={recoverPending}>
            {recoverPending ? "Enviando..." : "Enviar link para redefinir senha"}
          </Button>
          <button
            type="button"
            onClick={() => setMode("signin")}
            className="w-full text-center text-xs text-muted hover:text-foreground"
          >
            ← Voltar para o login
          </button>
        </form>
      )}

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="secondary" className="w-full gap-2">
          <GoogleIcon />
          Continuar com Google
        </Button>
      </form>
    </div>
  );
}
