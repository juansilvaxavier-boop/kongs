"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

/**
 * Combobox simples: input de texto com sugestões filtradas conforme o
 * usuário digita, mas que envia o id da opção escolhida (não o texto) num
 * campo escondido — pra caber num <form action={...}> normal como o
 * <Select> nativo que ele substitui.
 */
export function SearchableSelect({
  name,
  options,
  defaultValue = "",
  placeholder = "Digite para buscar…",
  className = "",
}: {
  name: string;
  options: SearchableSelectOption[];
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialOption = options.find((o) => o.value === defaultValue) ?? null;

  const [query, setQuery] = useState(initialOption?.label ?? "");
  const [selectedValue, setSelectedValue] = useState(initialOption?.value ?? "");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={selectedValue} />
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedValue("");
          setOpen(true);
        }}
        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted/70 outline-none focus:border-accent/70 focus:ring-1 focus:ring-accent/40"
      />
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
        >
          {filtered.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === selectedValue}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-2"
                onMouseDown={(event) => {
                  event.preventDefault();
                  setSelectedValue(option.value);
                  setQuery(option.label);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
