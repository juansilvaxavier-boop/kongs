import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui";
import { AuditLogTable } from "./audit-log-table";

const PAGE_SIZE = 25;

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{
    tabela?: string;
    acao?: string;
    campeonato?: string;
    pagina?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { tabela, acao, campeonato, pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [{ data: rows, error }, { data: championships }] = await Promise.all([
    supabase.rpc("admin_list_audit_log", {
      p_limit: PAGE_SIZE,
      p_offset: offset,
      p_table_name: tabela || undefined,
      p_action: acao || undefined,
      p_championship_id: campeonato || undefined,
    }),
    supabase.from("championships").select("id, name").order("name"),
  ]);

  const totalCount = rows?.[0]?.total_count ?? 0;

  return (
    <div>
      <PageHeader eyebrow="Auditoria" title="Log de auditoria" />

      {error ? (
        <EmptyState>Não foi possível carregar o log de auditoria: {error.message}</EmptyState>
      ) : (
        <AuditLogTable
          rows={rows ?? []}
          totalCount={totalCount}
          page={page}
          pageSize={PAGE_SIZE}
          championships={championships ?? []}
          filters={{ tabela: tabela ?? "", acao: acao ?? "", campeonato: campeonato ?? "" }}
        />
      )}
    </div>
  );
}
