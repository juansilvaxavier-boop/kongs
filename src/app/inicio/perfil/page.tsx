import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, FileInput, Input, Label, PageHeader, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { updateProfile } from "./actions";

const PERSONA_LABELS: Record<string, string> = {
  jogador: "Jogador",
  treinador: "Treinador",
  torcedor: "Torcedor",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, avatar_url, persona")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div>
      <PageHeader eyebrow="Sua conta" title="Perfil" />

      <Card className="p-5">
        <ActionForm action={updateProfile} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-muted">
                {(profile?.first_name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="flex-1">
              <Label>Foto</Label>
              <FileInput name="avatar" accept="image/*" />
            </div>
          </div>

          <div>
            <Label>E-mail</Label>
            <Input value={user.email ?? ""} disabled />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Label>Nome</Label>
              <Input
                name="first_name"
                required
                defaultValue={profile?.first_name ?? ""}
                placeholder="Seu nome"
              />
            </div>
            <div className="flex-1">
              <Label>Sobrenome</Label>
              <Input
                name="last_name"
                defaultValue={profile?.last_name ?? ""}
                placeholder="Seu sobrenome"
              />
            </div>
          </div>

          <div>
            <Label>Telefone</Label>
            <Input
              name="phone"
              type="tel"
              defaultValue={profile?.phone ?? ""}
              placeholder="(00) 00000-0000"
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
            <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
