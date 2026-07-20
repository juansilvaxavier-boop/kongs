"use client";

import { useState } from "react";
import { toggleFavorite, type FavoriteKind } from "@/app/favoritos/actions";

export function FavoriteButton({
  kind,
  entityId,
  initialFavorited,
  size = "md",
  className = "",
}: {
  kind: FavoriteKind;
  entityId: string;
  initialFavorited: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  const sizeClasses = size === "sm" ? "h-7 w-7 text-base" : "h-9 w-9 text-lg";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        setPending(true);
        const result = await toggleFavorite(kind, entityId, favorited);
        if (result.ok) {
          setFavorited(result.data);
        } else {
          alert(result.error);
        }
        setPending(false);
      }}
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      title={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses} ${
        favorited
          ? "border-accent/60 bg-accent/10 text-accent"
          : "border-border bg-surface-2 text-muted hover:text-foreground"
      } ${className}`}
    >
      {favorited ? "★" : "☆"}
    </button>
  );
}
