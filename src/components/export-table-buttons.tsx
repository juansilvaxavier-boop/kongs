import { ExportCsvButton } from "./export-csv-button";
import { ExportPdfButton } from "./export-pdf-button";

export function ExportTableButtons({
  fileName,
  title,
  columns,
  rows,
}: {
  fileName: string;
  title: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <ExportCsvButton fileName={fileName} columns={columns} rows={rows} />
      <ExportPdfButton fileName={fileName} title={title} columns={columns} rows={rows} />
    </div>
  );
}
