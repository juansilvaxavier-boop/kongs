import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, BrandMark, Card, PageHeader } from "@/components/ui";
import { SocialLinks } from "@/components/social-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { JoinRachaForm } from "./join-form";
import { ConfirmAttendanceButton } from "./confirm-attendance-button";

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

export default async function RachaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: championship },
    { data: settings },
    { data: teams },
    { data: players },
    { data: sessions },
    { data: confirmations },
  ] = await Promise.all([
    supabase.from("championships").select("id, name, owner_id, kind").eq("id", id).maybeSingle(),
    supabase.from("racha_settings").select("monthly_price, daily_price").eq("championship_id", id).maybeSingle(),
    supabase.from("teams").select("id, name").eq("championship_id", id).order("name"),
    supabase
      .from("players")
      .select("id, name, position, team_id, user_id, payment_plan")
      .eq("championship_id", id),
    supabase
      .from("racha_sessions")
      .select("id, session_date, status, clock_status")
      .eq("championship_id", id)
      .order("session_date", { ascending: false }),
    supabase
      .from("racha_session_confirmations")
      .select("session_id, player_id, confirmed")
      .eq("championship_id", id),
  ]);

  if (!championship || championship.kind !== "racha") notFound();

  const isOwner = user?.id === championship.owner_id;
  const myPlayer = (players ?? []).find((p) => p.user_id === user?.id);
  const teamName = (teamId: string | null) => teams?.find((t) => t.id === teamId)?.name ?? "Sem time";

  const confirmedByPlayerAndSession = new Map(
    (confirmations ?? []).map((c) => [`${c.session_id}:${c.player_id}`, c.confirmed])
  );

  return (
    <main className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <Link href="/racha" className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-bold uppercase tracking-wide">
              Kong&apos;s Game
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <SocialLinks />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Racha"
          title={championship.name}
          action={
            isOwner ? (
              <Link
                href={`/racha/${id}/gerenciar`}
                className="font-display text-sm font-bold uppercase tracking-wide text-accent hover:underline"
              >
                Gerenciar →
              </Link>
            ) : undefined
          }
        />

        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Preço</p>
          <div className="flex gap-6 text-sm">
            <span>
              Mensal: <strong className="text-foreground">{formatCurrency(settings?.monthly_price ?? 0)}</strong>
            </span>
            <span>
              Diária: <strong className="text-foreground">{formatCurrency(settings?.daily_price ?? 0)}</strong>
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
            Jogadores
          </h2>
          {!user ? (
            <p className="text-sm text-muted">
              <Link href={`/login?redirectTo=/racha/${id}`} className="text-accent hover:underline">
                Entre na sua conta
              </Link>{" "}
              para jogar neste racha.
            </p>
          ) : myPlayer ? (
            <p className="text-sm text-foreground">
              Você está registrado como <strong>{myPlayer.name}</strong> ({myPlayer.position}) — plano{" "}
              {myPlayer.payment_plan === "mensal" ? "mensal" : "diária"}.
            </p>
          ) : (
            <JoinRachaForm championshipId={id} />
          )}

          {(players ?? []).length > 0 && (
            <ul className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
              {(players ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="text-foreground">{p.name}</span>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    {p.position ?? "—"}
                    <Badge>{teamName(p.team_id)}</Badge>
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
          {(sessions ?? []).length === 0 ? (
            <Card className="p-5 text-sm text-muted">Nenhuma sessão agendada ainda.</Card>
          ) : (
            <div className="flex flex-col gap-3">
              {(sessions ?? []).map((session) => {
                const myConfirmed = myPlayer
                  ? (confirmedByPlayerAndSession.get(`${session.id}:${myPlayer.id}`) ?? false)
                  : false;
                const confirmedCount = (players ?? []).filter((p) =>
                  confirmedByPlayerAndSession.get(`${session.id}:${p.id}`)
                ).length;

                return (
                  <Card key={session.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-display text-base font-bold uppercase tracking-wide text-foreground">
                        {formatDate(session.session_date)}
                      </p>
                      <p className="text-xs text-muted">
                        {SESSION_STATUS_LABELS[session.status] ?? session.status} · {confirmedCount} confirmado(s)
                      </p>
                    </div>
                    {myPlayer && session.status !== "encerrado" && (
                      <ConfirmAttendanceButton
                        championshipId={id}
                        sessionId={session.id}
                        confirmed={myConfirmed}
                      />
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
