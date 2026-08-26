const LAST_NOTIFICATION_KEY = "queue-last-notification";
const NOTIFICATION_ICON = "/click-fila-icon.svg";

function supportsNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

async function showClientNotification(title, options) {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.register(
      "/notification-sw.js",
    );
    await navigator.serviceWorker.ready;
    await registration.showNotification(title, options);
    return;
  }

  const notification = new window.Notification(title, options);
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export function shouldExplainNotificationPermission() {
  return (
    supportsNotifications() &&
    window.isSecureContext &&
    window.Notification.permission === "default"
  );
}

export async function requestClientNotificationPermission() {
  if (!supportsNotifications()) return "unsupported";
  if (!window.isSecureContext) return "insecure";
  if (window.Notification.permission !== "default") {
    return window.Notification.permission;
  }
  return window.Notification.requestPermission();
}

function getNotificationContent(previous, current) {
  if (!current) return null;

  if (previous?.status !== current.status) {
    if (current.status === "CALLED")
      return ["É a sua vez!", "Você foi chamado. Dirija-se ao profissional."];
    if (current.status === "IN_SERVICE")
      return ["Atendimento iniciado", "Seu atendimento está em andamento."];
    if (current.status === "FINISHED")
      return ["Atendimento finalizado", "Seu atendimento foi concluído."];
    if (current.status === "CANCELLED")
      return [
        "Atendimento cancelado",
        "Sua participação na fila foi cancelada.",
      ];
    if (current.status === "WAITING" && previous) {
      return [
        "Você voltou para a fila",
        `Sua posição atual é ${current.position}.`,
      ];
    }
  }

  if (current.status === "WAITING" && previous?.position !== current.position) {
    return [
      "Sua posição mudou",
      `Agora você é o número ${current.position} da fila.`,
    ];
  }

  return null;
}

export async function notifyClientEntryChange(previous, current) {
  if (!supportsNotifications() || window.Notification.permission !== "granted")
    return false;

  const content = getNotificationContent(previous, current);
  if (!content) return false;

  const signature = `${current.id}:${current.status}:${current.position ?? ""}`;
  if (localStorage.getItem(LAST_NOTIFICATION_KEY) === signature) return false;

  try {
    await showClientNotification(content[0], {
      body: content[1],
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_ICON,
      tag: signature,
      renotify: true,
      vibrate: [250, 120, 250],
      data: { url: window.location.href },
    });

    localStorage.setItem(LAST_NOTIFICATION_KEY, signature);
    return true;
  } catch {
    return false;
  }
}

export function clearClientNotificationHistory() {
  localStorage.removeItem(LAST_NOTIFICATION_KEY);
}
