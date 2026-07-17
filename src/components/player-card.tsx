import { computeRarity, type Rarity } from "@/lib/gamification";

type Attributes = {
  ovr: number;
  ritmo: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  fisico: number;
};

const RARITY_STYLES: Record<Rarity, string> = {
  bronze: "bg-gradient-to-br from-[#8a5a35] to-[#c98a52] text-[#2b1a0d]",
  prata: "bg-gradient-to-br from-[#9ea7ad] to-[#eef1f2] text-[#1c2226]",
  ouro: "bg-gradient-to-br from-[#caa73d] to-[#f4d874] text-[#2b2205]",
};

const RARITY_LABELS: Record<Rarity, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
};

const ATTRIBUTE_LABELS: [keyof Attributes, string][] = [
  ["ritmo", "RIT"],
  ["finalizacao", "FIN"],
  ["passe", "PAS"],
  ["drible", "DRI"],
  ["defesa", "DEF"],
  ["fisico", "FIS"],
];

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function PlayerCard({
  name,
  position,
  number,
  photoUrl,
  crestUrl,
  attributes,
  size = "md",
  className,
}: {
  name: string;
  position: string | null;
  number?: number | null;
  photoUrl?: string | null;
  crestUrl?: string | null;
  attributes: Attributes;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const rarity = computeRarity(attributes.ovr);
  const sizes = {
    sm: "w-32 p-2.5 text-xs",
    md: "w-40 p-3 text-sm",
    lg: "w-56 p-4 text-base",
  };
  const photoSizes = { sm: "h-12 w-12", md: "h-16 w-16", lg: "h-24 w-24" };
  const crestSizes = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-11 w-11" };
  const ovrSizes = { sm: "text-3xl", md: "text-4xl", lg: "text-5xl" };

  return (
    <div
      className={`flex flex-col rounded-xl shadow-lg ${sizes[size]} ${RARITY_STYLES[rarity]} ${className ?? ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col items-center gap-1">
          <span className={`font-display font-bold leading-none ${ovrSizes[size]}`}>
            {Math.round(attributes.ovr)}
          </span>
          {crestUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={crestUrl}
              alt=""
              className={`${crestSizes[size]} rounded-full object-cover`}
            />
          )}
        </div>
        <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          {RARITY_LABELS[rarity]}
        </span>
      </div>

      <div className="my-2 flex justify-center">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            className={`${photoSizes[size]} rounded-full border-2 border-white/60 object-cover`}
          />
        ) : (
          <span
            className={`flex ${photoSizes[size]} items-center justify-center rounded-full border-2 border-white/60 bg-black/10 font-display font-bold`}
          >
            {initials(name)}
          </span>
        )}
      </div>

      <p className="truncate text-center font-display font-bold uppercase tracking-wide">
        {number ? `${number} · ` : ""}
        {name}
      </p>
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {position ?? "—"}
      </p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-black/10 pt-2 text-[11px] font-semibold">
        {ATTRIBUTE_LABELS.map(([key, label]) => (
          <div key={key} className="flex justify-between">
            <span className="opacity-70">{label}</span>
            <span>{Math.round(attributes[key])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
