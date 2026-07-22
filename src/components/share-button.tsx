"use client";

import { useToast } from "./toast-provider";

export function ShareButton({ title }: { title: string }) {
  const toast = useToast();

  return (
    <button
      type="button"
      title="Compartilhar"
      aria-label="Compartilhar"
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 text-muted transition hover:border-accent/60 hover:text-foreground sm:px-3"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
          } catch {
            // usuário cancelou o compartilhamento
          }
          return;
        }
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Link copiado!");
        } catch {
          toast.error(`Não foi possível copiar automaticamente. Link: ${url}`);
        }
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <circle cx="18" cy="5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="19" r="2.5" />
        <path d="M8.2 10.8 15.8 6.7M8.2 13.2l7.6 4.1" />
      </svg>
      <span className="hidden text-sm font-medium sm:inline">Compartilhar</span>
    </button>
  );
}
