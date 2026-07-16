import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveAuthenticatedDestination } from "@/lib/auth/destination";

export default async function Home() {
  const supabase = await createClient();
  redirect(await resolveAuthenticatedDestination(supabase));
}
