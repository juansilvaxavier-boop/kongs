import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function RegulamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: championship } = await supabase
    .from("championships")
    .select("rules_text")
    .eq("id", id)
    .maybeSingle();

  return (
    <div>
      <PageHeader eyebrow="Regras do campeonato" title="Regulamento" />
      {championship?.rules_text ? (
        <Card className="p-5">
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {championship.rules_text}
          </p>
        </Card>
      ) : (
        <EmptyState>O organizador ainda não publicou o regulamento deste campeonato.</EmptyState>
      )}
    </div>
  );
}
