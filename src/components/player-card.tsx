"use client";

import Image from "next/image";
import { useState } from "react";
import { computeRarity, type PlayerAttributes as Attributes, type Rarity } from "@/lib/gamification";

const CARD_WIDTH_PX = { sm: 128, md: 160, lg: 224 };
const CARD_CORNER_PX = { sm: 8, md: 10, lg: 14 };
const CARD_TIP_PX = { sm: 18, md: 22, lg: 30 };

function shieldClipPath(size: "sm" | "md" | "lg") {
  const w = CARD_WIDTH_PX[size];
  const c = CARD_CORNER_PX[size];
  const t = CARD_TIP_PX[size];
  return `polygon(${c}px 0, ${w - c}px 0, ${w}px ${c}px, ${w}px calc(100% - ${t}px), ${
    w / 2
  }px 100%, 0px calc(100% - ${t}px), 0px ${c}px)`;
}

const RARITY_STYLES: Record<
  Rarity,
  { card: string; border: string; text: string; sub: string; divider: string }
> = {
  bronze: {
    card: "bg-gradient-to-b from-[#a2652f] via-[#8a4f22] to-[#5c3216]",
    border: "border-[#e2a765]",
    text: "text-[#fbe4c8]",
    sub: "text-[#f0c497]/80",
    divider: "border-[#e2a765]/50",
  },
  prata: {
    card: "bg-gradient-to-b from-[#e7ecef] via-[#b7c1c7] to-[#7c8a91]",
    border: "border-white",
    text: "text-[#1c2226]",
    sub: "text-[#3a444a]/80",
    divider: "border-[#1c2226]/25",
  },
  ouro: {
    card: "bg-gradient-to-b from-[#f6d979] via-[#dcab35] to-[#96701c]",
    border: "border-[#fff2c2]",
    text: "text-[#3a2405]",
    sub: "text-[#4d3407]/80",
    divider: "border-[#3a2405]/25",
  },
  legend: {
    card: "bg-[radial-gradient(circle_at_50%_20%,#ffffff_0%,#f2ecd9_45%,#d8cca4_100%)]",
    border: "border-[#c9a94e]",
    text: "text-[#2a2412]",
    sub: "text-[#5a4f2c]/80",
    divider: "border-[#c9a94e]/50",
  },
};

const RARITY_LABELS: Record<Rarity, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  legend: "Legend",
};

const LEFT_ATTRIBUTES: [keyof Attributes, string][] = [
  ["ritmo", "RIT"],
  ["finalizacao", "FIN"],
  ["passe", "PAS"],
];
const RIGHT_ATTRIBUTES: [keyof Attributes, string][] = [
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
  const style = RARITY_STYLES[rarity];

  const [loadedPhotoUrl, setLoadedPhotoUrl] = useState(photoUrl);
  const [photoFailed, setPhotoFailed] = useState(false);
  if (photoUrl !== loadedPhotoUrl) {
    setLoadedPhotoUrl(photoUrl);
    setPhotoFailed(false);
  }

  const [loadedCrestUrl, setLoadedCrestUrl] = useState(crestUrl);
  const [crestFailed, setCrestFailed] = useState(false);
  if (crestUrl !== loadedCrestUrl) {
    setLoadedCrestUrl(crestUrl);
    setCrestFailed(false);
  }

  const sizes = {
    sm: "w-32 px-3 pb-2 pt-4 text-xs",
    md: "w-40 px-3.5 pb-2 pt-5 text-sm",
    lg: "w-56 px-5 pb-2 pt-7 text-base",
  };
  const photoSizes = { sm: "h-14 w-14", md: "h-20 w-20", lg: "h-28 w-28" };
  const crestSizes = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-9 w-9" };
  const ovrSizes = { sm: "text-2xl", md: "text-3xl", lg: "text-4xl" };
  const statTextSizes = { sm: "text-[9px]", md: "text-[11px]", lg: "text-sm" };

  return (
    <div
      className={`relative flex flex-col border-2 shadow-xl ${sizes[size]} ${style.card} ${style.border} ${style.text} ${className ?? ""}`}
      style={{ clipPath: shieldClipPath(size) }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col items-center leading-none">
          <span className={`font-display font-black ${ovrSizes[size]}`}>
            {Math.round(attributes.ovr)}
          </span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide">
            {position ?? "—"}
          </span>
        </div>
        {crestUrl && !crestFailed && (
          <span className={`relative shrink-0 ${crestSizes[size]}`}>
            <Image
              src={crestUrl}
              alt=""
              fill
              loading="eager"
              sizes="40px"
              className="rounded-full object-cover"
              onError={() => setCrestFailed(true)}
            />
          </span>
        )}
      </div>

      <div className="mt-1 flex justify-center">
        {photoUrl && !photoFailed ? (
          <span className={`relative ${photoSizes[size]}`}>
            <Image
              src={photoUrl}
              alt=""
              fill
              loading="eager"
              sizes="112px"
              className="rounded-full border-2 border-current/30 object-cover"
              onError={() => setPhotoFailed(true)}
            />
          </span>
        ) : (
          <span
            className={`flex ${photoSizes[size]} items-center justify-center rounded-full border-2 border-current/30 bg-black/10 font-display font-bold`}
          >
            {initials(name)}
          </span>
        )}
      </div>

      <p className="mt-1 truncate text-center font-display font-bold uppercase tracking-wide">
        {number ? `${number} · ` : ""}
        {name}
      </p>
      <p className={`text-center text-[10px] font-semibold uppercase tracking-widest ${style.sub}`}>
        {RARITY_LABELS[rarity]}
      </p>

      <div className={`mx-auto mt-2 flex w-full max-w-[85%] gap-3 border-t pt-2 ${style.divider}`}>
        <div className={`flex flex-1 flex-col gap-0.5 font-bold ${statTextSizes[size]}`}>
          {LEFT_ATTRIBUTES.map(([key, label]) => (
            <div key={key} className="flex justify-between">
              <span>{Math.round(attributes[key])}</span>
              <span className={style.sub}>{label}</span>
            </div>
          ))}
        </div>
        <div className={`h-auto w-px self-stretch border-l ${style.divider}`} />
        <div className={`flex flex-1 flex-col gap-0.5 font-bold ${statTextSizes[size]}`}>
          {RIGHT_ATTRIBUTES.map(([key, label]) => (
            <div key={key} className="flex justify-between">
              <span>{Math.round(attributes[key])}</span>
              <span className={style.sub}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: CARD_TIP_PX[size] }} aria-hidden />
    </div>
  );
}
