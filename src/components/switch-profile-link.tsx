import Link from "next/link";

export function SwitchProfileLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm text-foreground transition hover:border-accent/60"
    >
      {label}
    </Link>
  );
}
