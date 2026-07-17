import Link from "next/link";
import { Badge, Card, EmptyState } from "@/components/ui";

type Championship = {
  id: string;
  name: string;
  format: string;
};

export function ChampionshipsGrid({
  championships,
}: {
  championships: Championship[];
}) {
  if (championships.length === 0) {
    return <EmptyState>Nenhum campeonato publicado ainda.</EmptyState>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {championships.map((championship) => (
        <Link key={championship.id} href={`/campeonato/${championship.id}`}>
          <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-accent/50">
            <span className="font-medium text-foreground">
              {championship.name}
            </span>
            <Badge>{championship.format === "copa" ? "Copa" : "Liga"}</Badge>
          </Card>
        </Link>
      ))}
    </div>
  );
}
