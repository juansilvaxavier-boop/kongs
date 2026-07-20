"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { key: "formacoes", label: "Formações" },
  { key: "classificacao", label: "Classificação" },
  { key: "bolao", label: "Bolão" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function GameDetailTabs({
  formacoes,
  classificacao,
  bolao,
}: {
  formacoes: ReactNode;
  classificacao: ReactNode;
  bolao: ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("formacoes");
  const content: Record<TabKey, ReactNode> = { formacoes, classificacao, bolao };

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              active === tab.key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {content[active]}
    </div>
  );
}
