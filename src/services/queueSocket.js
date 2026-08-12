import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export function subscribeToQueue(
  sessionId,
  onQueueUpdate,
  onError,
  onConnected,
) {
  if (!sessionId) return () => {};

  const token = localStorage.getItem("token");
  const client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE_URL}/api/ws`),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},
    onConnect: () => {
      onConnected?.();
      client.subscribe(`/topic/queue/${sessionId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          const snapshot = Array.isArray(payload)
            ? payload
            : payload?.activeQueue ||
              payload?.entries ||
              payload?.queue ||
              (Array.isArray(payload?.data) ? payload.data : null);
          if (Array.isArray(snapshot)) {
            onQueueUpdate(snapshot, { partial: false });
            return;
          }

          const entryCandidate =
            payload?.entry ||
            payload?.queueEntry ||
            (!Array.isArray(payload?.data) ? payload?.data : null) ||
            payload;
          const updatedEntry = entryCandidate
            ? {
                ...entryCandidate,
                id:
                  entryCandidate.id ||
                  entryCandidate.entryId ||
                  entryCandidate.queueEntryId,
                userId:
                  entryCandidate.userId ||
                  entryCandidate.clientId ||
                  entryCandidate.customerId,
              }
            : null;
          if (updatedEntry?.id) {
            onQueueUpdate([updatedEntry], { partial: true });
            return;
          }
          throw new Error(
            "O servidor enviou uma atualização da fila em formato não reconhecido.",
          );
        } catch (error) {
          onError?.(error);
        }
      });
    },
    onStompError: (frame) =>
      onError?.(
        new Error(
          frame.headers?.message || "Falha na atualização em tempo real.",
        ),
      ),
    onWebSocketError: () =>
      onError?.(
        new Error("Não foi possível conectar às atualizações em tempo real."),
      ),
    onWebSocketClose: () => {
      if (client.active)
        onError?.(
          new Error(
            "A atualização em tempo real foi interrompida. Tentando reconectar...",
          ),
        );
    },
  });

  client.activate();
  return () => {
    client.deactivate();
  };
}
