import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { FinancialTable } from "./financial-table";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function FinanceiroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: canManage } = await supabase.rpc("can_manage_finance", {
    p_championship_id: id,
  });
  if (!canManage) {
    return (
      <div>
        <PageHeader eyebrow="Controle financeiro" title="Financeiro" />
        <EmptyState>Você não tem permissão para gerenciar o financeiro deste campeonato.</EmptyState>
      </div>
    );
  }

  const [{ data: entries }, { data: teams }, { data: games }] = await Promise.all([
    supabase
      .from("financial_entries")
      .select("id, type, category, description, amount, team_id, paid, entry_date")
      .eq("championship_id", id)
      .order("entry_date", { ascending: false }),
    supabase.from("teams").select("id, name").eq("championship_id", id).order("name"),
    supabase
      .from("games")
      .select("id, referee_paid, referee_payment_amount")
      .eq("championship_id", id)
      .not("referee_payment_amount", "is", null),
  ]);

  const manualReceitasPagas = (entries ?? [])
    .filter((e) => e.type === "receita" && e.paid)
    .reduce((sum, e) => sum + e.amount, 0);
  const manualDespesasPagas = (entries ?? [])
    .filter((e) => e.type === "despesa" && e.paid)
    .reduce((sum, e) => sum + e.amount, 0);
  const manualPendencias = (entries ?? [])
    .filter((e) => !e.paid)
    .reduce((sum, e) => sum + e.amount, 0);

  const refereePagos = (games ?? [])
    .filter((g) => g.referee_paid)
    .reduce((sum, g) => sum + (g.referee_payment_amount ?? 0), 0);
  const refereePendentes = (games ?? [])
    .filter((g) => !g.referee_paid)
    .reduce((sum, g) => sum + (g.referee_payment_amount ?? 0), 0);

  const totalReceitas = manualReceitasPagas;
  const totalDespesas = manualDespesasPagas + refereePagos;
  const saldo = totalReceitas - totalDespesas;
  const totalPendencias = manualPendencias + refereePendentes;

  return (
    <div>
      <PageHeader eyebrow="Controle financeiro" title="Financeiro" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Receitas</p>
          <p className="mt-1 font-display text-2xl font-bold text-accent">
            {formatCurrency(totalReceitas)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Despesas (inclui arbitragem)
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-danger">
            {formatCurrency(totalDespesas)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Saldo</p>
          <p
            className={`mt-1 font-display text-2xl font-bold ${
              saldo >= 0 ? "text-accent" : "text-danger"
            }`}
          >
            {formatCurrency(saldo)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Pendências (inclui arbitragem)
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {formatCurrency(totalPendencias)}
          </p>
        </Card>
      </div>

      <FinancialTable championshipId={id} entries={entries ?? []} teams={teams ?? []} />
    </div>
  );
}
