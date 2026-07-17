import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandMark, Button, Card, Input, Label, PageHeader, Select } from "@/components/ui";
import { signOut } from "@/app/login/actions";
import { updateProfile } from "./actions";

const PERSONA_LABELS: Record<string, string> = {
  jogador: "Jogador",
  treinador: "Treinador",
  torcedor: "Torcedor",
};

export default async function MeuPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, persona")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-bold uppercase tracking-wide">
              Kongs Campeonatos
            </span>
          </span>
          <form action={signOut}>
            <Button type="submit" variant="secondary">
              Sair
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow={user.email ?? ""}
          title="Meu perfil"
          action={
            <Link href="/campeonato" className="text-sm text-accent hover:underline">
              Ver campeonatos →
            </Link>
          }
        />

        <p className="-mt-4 mb-6 text-sm text-muted">
          Você pode visualizar, comentar e compartilhar as informações dos
          campeonatos. Apenas o organizador pode criar e alterar dados de um
          campeonato.
        </p>

        <Card className="p-5">
          <form action={updateProfile} className="flex flex-col gap-4">
            <div>
              <Label>Nome</Label>
              <Input
                name="display_name"
                required
                defaultValue={profile?.display_name ?? ""}
                placeholder="Seu nome"
              />
            </div>
            <div>
              <Label>Foto (URL)</Label>
              <Input
                name="avatar_url"
                type="url"
                defaultValue={profile?.avatar_url ?? ""}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Você é...</Label>
              <Select name="persona" required defaultValue={profile?.persona ?? ""}>
                <option value="" disabled>
                  Selecione
                </option>
                {Object.entries(PERSONA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
