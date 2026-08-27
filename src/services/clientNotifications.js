import { apiRequest } from "./api";
import { API_ROUTES } from "../routes/apiRoutes";

const WEB_PUSH_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;

function supportsNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

function supportsWebPush() {
  return (
    supportsNotifications() &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}

async function registerNotificationServiceWorker() {
  const registration = await navigator.serviceWorker.register(
    "/notification-sw.js",
  );
  await navigator.serviceWorker.ready;
  return registration;
}

async function subscribeToWebPush() {
  if (!WEB_PUSH_PUBLIC_KEY) {
    throw new Error("A chave pública de notificações não foi configurada.");
  }

  const registration = await registerNotificationServiceWorker();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(WEB_PUSH_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  await apiRequest(API_ROUTES.subscribeNotifications, {
    method: "POST",
    body: {
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      },
    },
  });

  return subscription;
}

export function shouldExplainNotificationPermission() {
  return (
    supportsNotifications() &&
    window.isSecureContext &&
    window.Notification.permission === "default"
  );
}

export async function requestClientNotificationPermission() {
  if (!supportsWebPush()) {
    if (supportsNotifications() && !window.isSecureContext) return "insecure";
    return "unsupported";
  }

  const permission =
    window.Notification.permission === "default"
      ? await window.Notification.requestPermission()
      : window.Notification.permission;

  if (permission !== "granted") return permission;

  try {
    await subscribeToWebPush();
    return "granted";
  } catch (error) {
    console.error("Não foi possível cadastrar o Web Push:", error);
    return "subscription-failed";
  }
}
