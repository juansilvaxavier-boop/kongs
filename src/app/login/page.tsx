import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="pitch-lines flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          Painel do organizador
        </p>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide text-foreground">
          Kongs Campeonatos
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Gerencie times, jogadores, jogos e a classificação dos seus
          campeonatos de futebol em um só lugar.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
