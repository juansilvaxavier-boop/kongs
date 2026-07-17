"use client";

import { useFormStatus } from "react-dom";
import {
  useState,
  type ButtonHTMLAttributes,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { Button } from "./ui";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

export function SubmitButton({
  children,
  pendingText,
  variant,
  className,
  ...props
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children" | "className">) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      className={className}
      {...props}
    >
      {pending ? (pendingText ?? "Salvando…") : children}
    </Button>
  );
}

type ActionFormProps = {
  action: (formData: FormData) => Promise<void>;
  onSuccess?: () => void;
  children: ReactNode;
  successMessage?: string;
} & Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "children">;

export function ActionForm({
  action,
  onSuccess,
  children,
  successMessage = "Salvo com sucesso.",
  ...formProps
}: ActionFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAction(formData: FormData) {
    setError(null);
    setSuccess(false);
    try {
      await action(formData);
      setSuccess(true);
      onSuccess?.();
      window.setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form action={handleAction} {...formProps}>
      {children}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-2 text-sm text-accent">{successMessage}</p>
      ) : null}
    </form>
  );
}
