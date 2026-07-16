"use client";

import { useState } from "react";
import { Input } from "@/components/ui";
import { localInputToIso } from "@/lib/datetime";

export function GameDateField({
  defaultValue = "",
  className,
}: {
  defaultValue?: string;
  className?: string;
}) {
  const [iso, setIso] = useState(() => localInputToIso(defaultValue));

  return (
    <>
      <Input
        type="datetime-local"
        defaultValue={defaultValue}
        onChange={(event) => setIso(localInputToIso(event.target.value))}
        className={className}
      />
      <input type="hidden" name="date" value={iso} />
    </>
  );
}
