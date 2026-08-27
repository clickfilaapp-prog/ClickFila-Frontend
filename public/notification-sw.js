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
    body:
      notification.body ||
      payload.message ||
      "Você recebeu uma nova atualização.",
    icon: notification.icon || "/click-fila-icon.svg",
    tag: notification.tag,
    data: {
      ...(payload.data || {}),
      url: notification.url || payload.data?.url || "/",
    },
  };

  if (notification.badge) options.badge = notification.badge;

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
