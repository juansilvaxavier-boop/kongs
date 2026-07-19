type Sponsor = { id: string; name: string; logo_url: string | null; link_url: string | null };

export function SponsorsFooter({ sponsors }: { sponsors: Sponsor[] }) {
  const withLogo = sponsors.filter((s) => s.logo_url);
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
