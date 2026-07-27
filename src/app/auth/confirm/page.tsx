import type { EmailOtpType } from "@supabase/supabase-js";
import { BrandMark, Card } from "@/components/ui";
import Link from "next/link";
import { ConfirmForm } from "./confirm-form";

export default async function AuthConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash: tokenHash, type, next } = await searchParams;

  return (
    <main className="pitch-lines flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 flex justify-center">
        <BrandMark />
      </div>
      {tokenHash && type ? (
        <ConfirmForm tokenHash={tokenHash} type={type as EmailOtpType} next={next ?? null} />
      ) : (
        <Card className="w-full max-w-sm space-y-3 p-6 text-center">
          <p className="text-sm text-danger">Link inválido.</p>
          <Link href="/login" className="text-sm text-accent hover:underline">
            Voltar para o login
          </Link>
        </Card>
      )}
    </main>
  );
}
