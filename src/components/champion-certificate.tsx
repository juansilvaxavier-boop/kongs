import Image from "next/image";
import { Card } from "./ui";
import { ExportImageButton } from "./export-image-button";

export function ChampionCertificate({
  championshipName,
  teamName,
  teamCrestUrl,
}: {
  championshipName: string;
  teamName: string;
  teamCrestUrl: string | null;
}) {
  const dateLabel = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        id="champion-certificate"
        className="w-full max-w-md border-4 border-double border-[#c9a94e] bg-[radial-gradient(circle_at_50%_0%,#fdf6e3_0%,#f2ecd9_45%,#d8cca4_100%)] p-8 text-center"
      >
        <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-[#8a6d1f]">
          Certificado de campeão
        </p>
        <p className="mt-3 font-display text-lg font-bold uppercase tracking-wide text-[#2a2412]">
          {championshipName}
        </p>

        {teamCrestUrl && (
          <span className="relative mx-auto mt-6 block h-20 w-20">
            <Image
              src={teamCrestUrl}
              alt=""
              fill
              loading="eager"
              sizes="80px"
              className="rounded-full object-cover"
            />
          </span>
        )}

        <p className="mt-4 font-display text-2xl font-black uppercase tracking-wide text-[#3a2405]">
          {teamName}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#8a6d1f]">
          é o grande campeão
        </p>

        <div className="mx-auto mt-6 h-px w-2/3 bg-[#c9a94e]/60" />
        <p className="mt-3 text-xs text-[#5a4f2c]">{dateLabel}</p>
      </div>

      <Card className="w-full max-w-md p-3">
        <ExportImageButton targetId="champion-certificate" fileName={`certificado-${teamName}`} />
      </Card>
    </div>
  );
}
