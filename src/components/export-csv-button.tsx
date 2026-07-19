"use client";

import { Button } from "./ui";

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function ExportCsvButton({
  fileName,
  columns,
  rows,
}: {
  fileName: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        const lines = [columns, ...rows].map((row) => row.map(csvCell).join(";"));
        // BOM no início para o Excel abrir acentos corretamente.
        const csv = "﻿" + lines.join("\r\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }}
    >
      Baixar CSV
    </Button>
  );
}
