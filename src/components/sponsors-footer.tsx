"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { trackSponsorEvent } from "./sponsor-tracking-actions";

type Sponsor = { id: string; name: string; logo_url: string | null; link_url: string | null };

export function SponsorsFooter({ sponsors }: { sponsors: Sponsor[] }) {
  const withLogo = sponsors.filter((s) => s.logo_url);
  const trackedViews = useRef(new Set<string>());

  useEffect(() => {
    for (const sponsor of withLogo) {
      if (trackedViews.current.has(sponsor.id)) continue;
      trackedViews.current.add(sponsor.id);
      void trackSponsorEvent(sponsor.id, "view");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withLogo.map((s) => s.id).join(",")]);

  if (withLogo.length === 0) return null;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-6 overflow-x-auto px-4 py-3 sm:px-6">
        {withLogo.map((sponsor) => {
          const logo = (
            <span className="relative h-10 w-20 shrink-0">
              <Image
                src={sponsor.logo_url!}
                alt={sponsor.name}
                title={sponsor.name}
                fill
                loading="eager"
                sizes="80px"
                className="object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
              />
            </span>
          );
          return sponsor.link_url ? (
            <a
              key={sponsor.id}
              href={sponsor.link_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => void trackSponsorEvent(sponsor.id, "click")}
              className="shrink-0"
            >
              {logo}
            </a>
          ) : (
            <span key={sponsor.id} className="shrink-0">
              {logo}
            </span>
          );
        })}
      </div>
    </footer>
  );
}
