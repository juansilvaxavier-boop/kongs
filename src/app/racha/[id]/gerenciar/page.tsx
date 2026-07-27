import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, BrandMark, Card, EmptyState, Input, Label, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { SocialLinks } from "@/components/social-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { computeFinancialTotals } from "@/lib/financial";
import { FinancialTable } from "@/app/campeonatos/[id]/financeiro/financial-table";
import { updateRachaSettings, createRachaSession } from "./actions";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

const SESSION_STATUS_LABELS: Record<string, string> = {
  agendado: "Agendado",
  sorteio_feito: "Sorteio feito",
  em_andamento: "Em andamento",
  encerrado: "Encerrado",
};

export default async function RachaGerenciarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: isAdmin }] = await Promise.all([
    supabase.from("championships").select("id, name, kind").eq("id", id).maybeSingle(),
    supabase.rpc("is_championship_admin", { p_championship_id: id }),
  ]);

  if (!championship || championship.kind !== "racha") notFound();
  if (!isAdmin) {
    return (
      <main className="pitch-lines flex min-h-dvh flex-1 flex-col">
        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
          <PageHeader eyebrow="Racha" title={championship.name} />
          <EmptyState>Você não tem permissão para gerenciar este racha.</EmptyState>
        </div>
      </main>
    );
  }

  const [
    { data: settings },
    { data: sessions },
    { data: players },
    { data: confirmations },
    { data: teams },
    { data: entries },
  ] = await Promise.all([
    supabase.from("racha_settings").select("monthly_price, daily_price").eq("championship_id", id).maybeSingle(),
    supabase
      .from("racha_sessions")
      .select("id, session_date, status")
      .eq("championship_id", id)
      .order("session_date", { ascending: false }),
    supabase.from("players").select("id, name, position, team_id, payment_plan").eq("championship_id", id),
    supabase.from("racha_session_confirmations").select("session_id, player_id, confirmed").eq("championship_id", id),
    supabase.from("teams").select("id, name").eq("championship_id", id).order("name"),
    supabase
      .from("financial_entries")
      .select("id, type, category, description, amount, team_id, paid_amount, entry_date")
      .eq("championship_id", id)
      .order("entry_date", { ascending: false }),
  ]);

  const { receitas, despesas, saldo, pendencias } = computeFinancialTotals(
    (entries ?? []).map((e) => ({
      type: e.type as "receita" | "despesa",
      amount: e.amount,
      paid_amount: e.paid_amount,
    })),
    0,
    0
  );

  return (
    <main className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <Link href={`/racha/${id}`} className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-bold uppercase tracking-wide">Kong&apos;s Game</span>
          </Link>
          <div className="flex items-center gap-2">
            <SocialLinks />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Gerenciar racha"
          title={championship.name}
          action={
            <Link
              href={`/racha/${id}`}
              className="font-display text-sm font-bold uppercase tracking-wide text-accent hover:underline"
            >
              ← Ver página pública
            </Link>
          }
        />

        <Card className="p-5">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
            Configurações
          </h2>
          <ActionForm
            action={(formData) => updateRachaSettings(id, formData)}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="w-40">
              <Label>Mensalidade (R$)</Label>
              <Input
                name="monthly_price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={settings?.monthly_price ?? 0}
              />
            </div>
            <div className="w-40">
              <Label>Diária (R$)</Label>
              <Input
                name="daily_price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={settings?.daily_price ?? 0}
              />
            </div>
            <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
          </ActionForm>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
            Jogadores ({(players ?? []).length})
          </h2>
          {(players ?? []).length === 0 ? (
            <p className="text-sm text-muted">Nenhum jogador entrou ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {(players ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="text-foreground">{p.name}</span>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    {p.position ?? "—"}
                    <Badge>{p.payment_plan === "mensal" ? "Mensal" : "Diária"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
            Sessões
          </h2>

          <Card className="mb-4 p-5">
            <ActionForm
              action={(formData) => createRachaSession(id, formData)}
              className="flex flex-wrap items-end gap-3"
              successMessage="Sessão criada!"
            >
              <div className="w-48">
                <Label>Data</Label>
                <Input name="session_date" type="date" required />
              </div>
              <SubmitButton pendingText="Criando…">Nova sessão</SubmitButton>
            </ActionForm>
          </Card>

          {(sessions ?? []).length === 0 ? (
            <EmptyState>Nenhuma sessão criada ainda.</EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {(sessions ?? []).map((session) => {
                const confirmedCount = (confirmations ?? []).filter(
                  (c) => c.session_id === session.id && c.confirmed
                ).length;
                return (
                  <Link key={session.id} href={`/racha/${id}/gerenciar/${session.id}`}>
                    <Card className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-accent/60">
                      <div>
                        <p className="font-display text-base font-bold uppercase tracking-wide text-foreground">
                          {formatDate(session.session_date)}
                        </p>
                        <p className="text-xs text-muted">
                          {SESSION_STATUS_LABELS[session.status] ?? session.status} · {confirmedCount} confirmado(s)
                        </p>
                      </div>
                      <span className="font-display text-sm font-bold uppercase tracking-wide text-accent">
                        Gerenciar →
                      </span>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
            Financeiro
          </h2>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Receitas</p>
              <p className="mt-1 font-display text-2xl font-bold text-accent">{formatCurrency(receitas)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Despesas</p>
              <p className="mt-1 font-display text-2xl font-bold text-danger">{formatCurrency(despesas)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Saldo</p>
              <p className={`mt-1 font-display text-2xl font-bold ${saldo >= 0 ? "text-accent" : "text-danger"}`}>
                {formatCurrency(saldo)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pendências</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">{formatCurrency(pendencias)}</p>
            </Card>
          </div>
          <FinancialTable championshipId={id} entries={entries ?? []} teams={teams ?? []} />
        </div>
      </div>
    </main>
  );
}
