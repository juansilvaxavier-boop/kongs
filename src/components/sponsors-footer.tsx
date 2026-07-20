"use client";

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
    <footer className="border-t border-border bg-surface/70 py-6">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-6 px-4 sm:px-6">
        {withLogo.map((sponsor) => {
          const logo = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sponsor.logo_url!}
              alt={sponsor.name}
              title={sponsor.name}
              className="h-10 w-auto object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
            />
          );
          return sponsor.link_url ? (
            <a
              key={sponsor.id}
              href={sponsor.link_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => void trackSponsorEvent(sponsor.id, "click")}
            >
              {logo}
            </a>
          ) : (
            <span key={sponsor.id}>{logo}</span>
          );
        })}
      </div>
    </footer>
  );
}
