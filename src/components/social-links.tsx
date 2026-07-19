const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=5517988308831&text&type=phone_number&app_absent=0";
const INSTAGRAM_URL = "https://www.instagram.com/kongsoficialbr/";

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted transition hover:border-accent/60 hover:text-foreground"
    >
      {children}
    </a>
  );
}

export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <IconLink href={WHATSAPP_URL} label="Fale conosco no WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.82L2 22l5.4-1.36a9.9 9.9 0 0 0 4.64 1.13h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.64-1.03-5.13-2.9-7C17.19 3.03 14.68 2 12.04 2zm0 18.06h-.01a8.14 8.14 0 0 1-4.15-1.14l-.3-.18-3.09.8.82-3.01-.19-.31a8.16 8.16 0 0 1-1.25-4.31c0-4.5 3.66-8.16 8.17-8.16 2.18 0 4.23.85 5.77 2.4a8.1 8.1 0 0 1 2.39 5.77c0 4.5-3.67 8.14-8.16 8.14zm4.48-6.11c-.24-.12-1.44-.71-1.67-.8-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.96-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.95-1.21-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.5.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14 0-.3-.02-.46-.02s-.42.06-.64.3c-.22.24-.85.83-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.71 2.62 4.15 3.67.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.46-.28z" />
        </svg>
      </IconLink>
      <IconLink href={INSTAGRAM_URL} label="Siga no Instagram">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
        </svg>
      </IconLink>
    </div>
  );
}
