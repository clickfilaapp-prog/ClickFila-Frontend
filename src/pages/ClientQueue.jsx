import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  CancellationModal,
  ClientStatus,
  NotificationConsentModal,
  QueueFinder,
} from "../components/clientQueue";
import { ConfirmationModal } from "../components/professionalDashboard";
import {
  cancelEntry,
  getActiveEntry,
  getLatestEntry,
  getQueueState,
  getQueueByCode,
  joinQueue,
} from "../services/queue";
import { subscribeToQueue } from "../services/queueSocket";
import {
  clearClientNotificationHistory,
  notifyClientEntryChange,
  requestClientNotificationPermission,
  shouldExplainNotificationPermission,
} from "../services/clientNotifications";

export default function ClientQueue() {
  const [ticketCode, setTicketCode] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [queue, setQueue] = useState(null);
  const [entry, setEntry] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const entryRef = useRef(null);
  const notifiedCancellationRef = useRef(null);
  const hasConnectedRef = useRef(false);
  const isTimerSyncingRef = useRef(false);
  const [cancelAlert, setCancelAlert] = useState(false);
  const [confirmCancellation, setConfirmCancellation] = useState(false);
  const [showNotificationConsent, setShowNotificationConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState("error");
  const [loading, setLoading] = useState(false);
  const peopleInQueue = queue?.peopleInQueue ?? queue?.activeQueue?.length ?? 0;

  function getEntrySessionId(activeEntry) {
    return (
      activeEntry?.queueSessionId ||
      activeEntry?.sessionId ||
      activeEntry?.queueSession?.id ||
      activeEntry?.session?.id ||
      activeEntry?.queue?.sessionId ||
      localStorage.getItem("queue-client-session-id") ||
      null
    );
  }

  function updateEntry(nextEntry) {
    const previous = entryRef.current;
    if (previous?.id && String(previous.id) === String(nextEntry?.id)) {
      notifyClientEntryChange(previous, nextEntry);
    }
    entryRef.current = nextEntry;
    setEntry(nextEntry);
  }

  async function checkLatestCancellation(expectedEntryId = null) {
    const latest = await getLatestEntry();
    const isExpectedEntry =
      !expectedEntryId || String(latest?.id) === String(expectedEntryId);
    if (
      latest?.status === "CANCELLED" &&
      isExpectedEntry &&
      latest.id !== notifiedCancellationRef.current
    ) {
      notifiedCancellationRef.current = latest.id;
      notifyClientEntryChange(entryRef.current, latest);
      setCancelAlert(true);
    }
  }

  async function loadActiveEntry({ silent = false } = {}) {
    try {
      const queueState = await getQueueState();
      const activeEntry = queueState?.activeEntry ?? null;
      if (activeEntry) {
        updateEntry(activeEntry);
        const activeSessionId = getEntrySessionId(activeEntry);
        if (activeSessionId) {
          setSessionId(activeSessionId);
          localStorage.setItem("queue-client-session-id", activeSessionId);
        }
        return;
      }
      const previous = entryRef.current;
      if (previous?.status === "IN_SERVICE")
        updateEntry({ ...previous, status: "FINISHED" });
      else {
        const latest = queueState?.latestHistoricalEntry ?? null;
        const isExpectedEntry =
          Boolean(previous?.id) && String(latest?.id) === String(previous.id);
        if (
          latest?.status === "CANCELLED" &&
          isExpectedEntry &&
          latest.id !== notifiedCancellationRef.current
        ) {
          notifiedCancellationRef.current = latest.id;
          notifyClientEntryChange(previous, latest);
          setCancelAlert(true);
        }
        updateEntry(null);
      }
      setSessionId(null);
      localStorage.removeItem("queue-client-session-id");
      localStorage.removeItem("queue-client-ticket-code");
    } catch (error) {
      if (!silent) setMessage(error.message);
    }
  }

  async function synchronizeCalledTimer() {
    if (isTimerSyncingRef.current) return;
    isTimerSyncingRef.current = true;
    try {
      const activeEntry = await getActiveEntry();
      if (activeEntry?.status === "CALLED") updateEntry(activeEntry);
    } finally {
      isTimerSyncingRef.current = false;
    }
  }

  useEffect(() => {
    loadActiveEntry();
  }, []);

  useEffect(() => {
    if (!sessionId) return undefined;
    return subscribeToQueue(
      sessionId,
      (activeQueue, { partial = false } = {}) => {
        setMessage("");
        const previous = entryRef.current;
        if (!previous?.id) return;
        const waitingEntries = activeQueue
          .filter((item) => item.status === "WAITING")
          .sort(
            (first, second) => Number(first.position) - Number(second.position),
          );
        const waitingIndex = waitingEntries.findIndex(
          (item) => String(item.id) === String(previous.id),
        );
        const receivedEntry = activeQueue.find(
          (item) =>
            String(item.id) === String(previous.id) ||
            (previous.userId &&
              item.userId &&
              String(item.userId) === String(previous.userId)),
        );
        const updatedEntry =
          receivedEntry && waitingIndex >= 0
            ? { ...receivedEntry, position: waitingIndex + 1 }
            : receivedEntry;
        if (updatedEntry) {
          updateEntry(updatedEntry);
          if (updatedEntry.status === "CALLED") synchronizeCalledTimer();
          return;
        }
        if (partial) {
          const changedEntry = activeQueue[0];
          const isCurrentClientCalled =
            changedEntry?.status === "CALLED" &&
            (String(changedEntry.id) === String(previous.id) ||
              (previous.userId &&
                String(changedEntry.userId) === String(previous.userId)));
          if (isCurrentClientCalled) {
            synchronizeCalledTimer();
            return;
          }
          const changedPosition = Number(changedEntry?.position);
          const currentPosition = Number(previous.position);
          if (
            changedEntry?.status === "IN_SERVICE" &&
            Number.isFinite(changedPosition) &&
            Number.isFinite(currentPosition) &&
            changedPosition < currentPosition
          ) {
            updateEntry({
              ...previous,
              position: Math.max(1, currentPosition - 1),
            });
            return;
          }
          loadActiveEntry({ silent: true });
          return;
        }
        if (previous.status === "IN_SERVICE") {
          updateEntry({ ...previous, status: "FINISHED" });
          return;
        }
        checkLatestCancellation(previous.id).finally(() => updateEntry(null));
      },
      (socketError) => setMessage(socketError.message),
      () => {
        setMessage("");
        if (!hasConnectedRef.current) {
          hasConnectedRef.current = true;
          return;
        }
        loadActiveEntry({ silent: true });
      },
    );
  }, [sessionId]);

  async function handleSearch(event) {
    event.preventDefault();
    const code = ticketCode.trim();
    if (code.length < 4) {
      setMessage("Digite um token válido para buscar a fila.");
      return;
    }
    setLoading(true);
    setQueue(null);
    setMessageKind("error");
    setMessage("");
    try {
      const result = await getQueueByCode(code);
      setQueue(result);
      if (!result.isActive) setMessage("Esta fila está fechada no momento.");
    } catch (error) {
      setMessage(
        error.status === 404
          ? "Não encontramos uma fila com esse código."
          : error.message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function enterQueue({ requestNotifications = false } = {}) {
    if (!queue?.isActive) return;
    setShowNotificationConsent(false);
    setLoading(true);
    setMessageKind("error");
    setMessage("");
    try {
      const notificationPermission = requestNotifications
        ? await requestClientNotificationPermission()
        : window.Notification?.permission || "unsupported";
      if (notificationPermission === "denied") {
        setMessage(
          "As notificações estão bloqueadas. Libere a permissão nas configurações do navegador.",
        );
      } else if (
        notificationPermission === "unsupported" ||
        notificationPermission === "insecure"
      ) {
        setMessage(
          "Este navegador não permite notificações nesta conexão. Acompanhe a fila por esta tela.",
        );
      }
      const joinedEntry = await joinQueue(queue.sessionId, serviceName.trim());
      clearClientNotificationHistory();
      setSessionId(queue.sessionId);
      localStorage.setItem("queue-client-session-id", queue.sessionId);
      updateEntry(joinedEntry);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleJoin(event) {
    event.preventDefault();
    if (!queue?.isActive || loading) return;

    if (shouldExplainNotificationPermission()) {
      setShowNotificationConsent(true);
      return;
    }

    enterQueue();
  }

  async function handleCancel() {
    if (!entry?.id) return;
    setConfirmCancellation(false);
    setLoading(true);
    setMessage("");
    try {
      await cancelEntry(entry.id);
      notifiedCancellationRef.current = entry.id;
      updateEntry(null);
      setQueue(null);
      setServiceName("");
      setSessionId(null);
      localStorage.removeItem("queue-client-session-id");
      localStorage.removeItem("queue-client-ticket-code");
      setMessageKind("success");
      setMessage(
        "Você saiu da fila com sucesso. Esperamos receber você novamente em breve!",
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function resetTracking() {
    updateEntry(null);
    setQueue(null);
    setTicketCode("");
    setServiceName("");
    setMessage("");
    setMessageKind("error");
    setSessionId(null);
    clearClientNotificationHistory();
    localStorage.removeItem("queue-client-session-id");
    localStorage.removeItem("queue-client-ticket-code");
  }

  function handleBackToSearch() {
    setQueue(null);
    setTicketCode("");
    setMessage("");
    setMessageKind("error");
  }

  return (
    <DashboardLayout>
      <main className="client-main">
        {cancelAlert && (
          <CancellationModal onClose={() => setCancelAlert(false)} />
        )}
        {showNotificationConsent && (
          <NotificationConsentModal
            isSubmitting={loading}
            onAllow={() => enterQueue({ requestNotifications: true })}
            onSkip={() => enterQueue()}
          />
        )}
        {confirmCancellation && (
          <ConfirmationModal
            confirmation={{
              title: "Sair da fila",
              message: "Deseja realmente cancelar sua posição nesta fila?",
              confirmLabel: "Sim, sair da fila",
              danger: true,
            }}
            loading={loading}
            onBack={() => setConfirmCancellation(false)}
            onConfirm={handleCancel}
          />
        )}
        {entry ? (
          <ClientStatus
            entry={entry}
            loading={loading}
            message={message}
            onCancel={() => setConfirmCancellation(true)}
            onDone={resetTracking}
          />
        ) : (
          <QueueFinder
            ticketCode={ticketCode}
            setTicketCode={setTicketCode}
            serviceName={serviceName}
            setServiceName={setServiceName}
            queue={queue}
            peopleInQueue={peopleInQueue}
            message={message}
            messageKind={messageKind}
            loading={loading}
            onSearch={handleSearch}
            onJoin={handleJoin}
            onBackToSearch={handleBackToSearch}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
