import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails("mailto:contato@kongs.app", vapidPublicKey, vapidPrivateKey);
}

/**
 * Notifica quem assinou push daquele campeonato (aba Visão Geral, botão
 * "Ativar notificações"). Silencioso se as chaves VAPID não estiverem
 * configuradas ou não houver assinantes — nunca bloqueia o fluxo
 * principal (marcar jogo como realizado).
 */
export async function notifyChampionshipSubscribers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  title: string,
  body: string,
  url: string
) {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("championship_id", championshipId);

  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({ title, body, url });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Assinatura expirada/inválida no navegador do usuário — remove
          // para não tentar de novo nas próximas notificações.
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}
