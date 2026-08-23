import Link from "next/link";
import { BrandMark, Card } from "@/components/ui";
import { SocialLinks } from "@/components/social-links";
import { ThemeToggle } from "@/components/theme-toggle";

const PRODUCTS = [
  {
    href: "/campeonato",
    title: "Kong's League",
    tagline: "Pra quem organiza campeonatos de verdade",
    bullets: [
      "Times, jogadores e técnicos com cadastro completo",
      "Jogos, classificação e mata-mata automáticos",
      "Súmula digital, financeiro e bolão entre torcedores",
    ],
    cta: "Ver campeonatos",
  },
  {
    href: "/racha",
    title: "Kong's Game",
    tagline: "Pra organizar o racha da semana",
    bullets: [
      "Qualquer um cria um racha e convida a galera",
      "Confirmação de presença e sorteio de times por OVR",
      "Cronômetro ao vivo, gols/cartões e cobrança mensal ou por diária",
    ],
    cta: "Ver rachas",
  },
] as const;

export default function Home() {
  return (
    <main className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-bold uppercase tracking-wide">
              Kong&apos;s
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SocialLinks />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Escolha seu produto
          </p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground sm:text-4xl">
            O que você quer organizar hoje?
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PRODUCTS.map((product) => (
            <Link key={product.href} href={product.href} className="group block h-full">
              <Card className="flex h-full flex-col p-6 transition group-hover:border-accent/60">
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                  {product.title}
                </h2>
                <p className="mb-4 mt-1 text-sm text-accent">{product.tagline}</p>
                <ul className="mb-6 flex-1 space-y-2 text-sm text-muted">
                  {product.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="text-accent">›</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
                <span className="font-display text-sm font-bold uppercase tracking-wide text-accent">
                  {product.cta} →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
