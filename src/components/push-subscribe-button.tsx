"use client";

import { useEffect, useState } from "react";
import { subscribeToPush } from "@/app/campeonato/[id]/actions";

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
    <button
      type="button"
      title="Ativar notificações"
      aria-label="Ativar notificações"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 text-muted transition hover:border-accent/60 hover:text-foreground disabled:opacity-60 sm:px-3"
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

          const result = await subscribeToPush(championshipId, {
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          });
          if (result.ok) setSubscribed(true);
        } catch {
          // usuário negou permissão ou navegador bloqueou — falha silenciosa
        } finally {
          setPending(false);
        }
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      <span className="hidden text-sm font-medium sm:inline">
        {pending ? "Ativando…" : "Notificações"}
      </span>
    </button>
  );
}
