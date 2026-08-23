import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BrandMark, Card, EmptyState, Input, Label, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { SocialLinks } from "@/components/social-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { createRacha } from "./actions";

export default async function RachaListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rachas } = await supabase
    .from("championships")
    .select("id, name, created_at")
    .eq("kind", "racha")
    .order("created_at", { ascending: false });

  return (
    <main className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
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

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <PageHeader eyebrow="Kong's Game" title="Rachas" />

        <Card className="mb-8 p-5">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
            Criar um racha
          </h2>
          {user ? (
            <ActionForm action={createRacha} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 basis-48">
                <Label>Nome do racha</Label>
                <Input name="name" required placeholder="Racha da galera" />
              </div>
              <div className="w-40">
                <Label>Mensalidade (R$)</Label>
                <Input name="monthly_price" type="number" min={0} step="0.01" defaultValue={0} />
              </div>
              <div className="w-40">
                <Label>Diária (R$)</Label>
                <Input name="daily_price" type="number" min={0} step="0.01" defaultValue={0} />
              </div>
              <SubmitButton pendingText="Criando…">Criar racha</SubmitButton>
            </ActionForm>
          ) : (
            <p className="text-sm text-muted">
              <Link href="/login?redirectTo=/racha" className="text-accent hover:underline">
                Entre na sua conta
              </Link>{" "}
              para criar um racha.
            </p>
          )}
        </Card>

        {!rachas || rachas.length === 0 ? (
          <EmptyState>Nenhum racha criado ainda.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rachas.map((racha) => (
              <Link key={racha.id} href={`/racha/${racha.id}`}>
                <Card className="p-5 transition hover:border-accent/60">
                  <p className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                    {racha.name}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
