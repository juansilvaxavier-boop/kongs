import Link from "next/link";
import { Badge, BrandMark, Card, EmptyState } from "@/components/ui";

type Championship = {
  id: string;
  name: string;
  format: string;
  logo_url?: string | null;
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
            <div className="flex items-center gap-3">
              {championship.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={championship.logo_url}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <BrandMark />
              )}
              <span className="font-medium text-foreground">
                {championship.name}
              </span>
            </div>
            <Badge>{championship.format === "copa" ? "Copa" : "Liga"}</Badge>
          </Card>
        </Link>
      ))}
    </div>
  );
}
