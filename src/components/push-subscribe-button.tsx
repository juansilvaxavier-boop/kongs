"use client";

import { useEffect, useState } from "react";
import { subscribeToPush } from "@/app/campeonato/[id]/actions";
import { Button } from "./ui";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscribeButton({ championshipId }: { championshipId: string }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
    // Suporte só é conhecido no cliente (depende de APIs do navegador) — sincroniza aqui.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(true);

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setSubscribed(!!subscription))
      .catch(() => {});
  }, []);

  if (!supported || subscribed) return null;

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;

          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            ) as BufferSource,
          });

          const json = subscription.toJSON();
          if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

          await subscribeToPush(championshipId, {
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          });
          setSubscribed(true);
        } catch {
          // usuário negou permissão ou navegador bloqueou — falha silenciosa
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Ativando..." : "🔔 Ativar notificações"}
    </Button>
  );
}
