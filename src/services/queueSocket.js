import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { clearAuthSession } from "../auth/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_FAILURES = 5;
const AUTHENTICATION_ERROR_PATTERN = /jwt|user\s+not\s+found/i;

function getSocketErrorMessage(error) {
  return [
    error?.headers?.message,
    error?.body,
    error?.message,
    error?.reason,
  ]
    .filter(Boolean)
    .join(" ");
}

export function isAuthenticationSocketError(error) {
  return AUTHENTICATION_ERROR_PATTERN.test(getSocketErrorMessage(error));
}

export function subscribeToQueue(
  sessionId,
  onQueueUpdate,
  onError,
  onConnected,
) {
  if (!sessionId) return () => {};

  const token = localStorage.getItem("token");
  let consecutiveFailures = 0;
  let stopped = false;
  let redirectingToLogin = false;
  let lastConnectionError = "";

  const client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE_URL}/api/ws`),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: RECONNECT_DELAY_MS,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},
    onConnect: () => {
      consecutiveFailures = 0;
      lastConnectionError = "";
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
    onStompError: (frame) => {
      if (isAuthenticationSocketError(frame)) {
        abortExpiredSession();
        return;
      }
      lastConnectionError =
        frame.headers?.message ||
        frame.body ||
        "Falha na atualização em tempo real.";
    },
    onWebSocketError: (event) => {
      if (isAuthenticationSocketError(event)) {
        abortExpiredSession();
        return;
      }
      lastConnectionError =
        "Não foi possível conectar às atualizações em tempo real.";
    },
    onWebSocketClose: (event) => {
      if (stopped || !client.active) return;
      if (isAuthenticationSocketError(event)) {
        abortExpiredSession();
        return;
      }

      consecutiveFailures += 1;
      if (consecutiveFailures >= MAX_RECONNECT_FAILURES) {
        stopClient();
        onError?.(
          new Error(
            "Você está offline ou o servidor está indisponível. Tente novamente mais tarde.",
          ),
        );
        return;
      }

      onError?.(
        new Error(
          `${lastConnectionError || "A atualização em tempo real foi interrompida."} ` +
            `Tentando reconectar (${consecutiveFailures}/${MAX_RECONNECT_FAILURES})...`,
        ),
      );
    },
  });

  function stopClient() {
    if (stopped) return;
    stopped = true;
    client.reconnectDelay = 0;
    void client.deactivate();
  }

  function abortExpiredSession() {
    if (redirectingToLogin) return;
    redirectingToLogin = true;
    stopClient();
    clearAuthSession();
    onError?.(
      new Error("Sua sessão expirou. Entre novamente para continuar."),
    );
    window.location.replace("/login");
  }

  if (!token) {
    clearAuthSession();
    onError?.(new Error("Sua sessão expirou. Entre novamente para continuar."));
    window.location.replace("/login");
    return () => {};
  }

  client.activate();
  return () => {
    stopClient();
  };
}
