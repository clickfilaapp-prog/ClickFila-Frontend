self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const notification = payload.notification || payload;
  const title = notification.title || "Click Fila";
  const options = {
    body: notification.body || "Há uma nova atualização na sua fila.",
    // O backend não precisa repetir estes campos em cada push. Sem os
    // fallbacks, o Android exibe o sino genérico do navegador.
    icon: notification.icon || "/notification-ticket-yellow.png?v=2",
    badge: notification.badge || "/notification-ticket-yellow.png?v=2",
    tag: notification.tag || "click-fila-update",
    renotify: notification.renotify ?? true,
    requireInteraction: notification.requireInteraction ?? true,
    silent: false,
    vibrate: notification.vibrate || [200, 100, 200],
    timestamp: notification.timestamp || Date.now(),
    data: {
      ...(payload.data || {}),
      url: notification.url || payload.data?.url,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const requestedUrl = event.notification.data?.url || "/";
  let safeTargetUrl = "/";
  try {
    const targetUrl = new URL(requestedUrl, self.location.origin);
    if (targetUrl.origin === self.location.origin) safeTargetUrl = targetUrl.href;
  } catch {
    // Mantém a navegação na página inicial para URLs inválidas.
  }
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (windowClients) => {
        const existingClient = windowClients.find(
          (client) => new URL(client.url).origin === self.location.origin,
        );

        if (existingClient) {
          existingClient.navigate(safeTargetUrl);
          return existingClient.focus();
        }

        return clients.openWindow(safeTargetUrl);
      },
    ),
  );
});
