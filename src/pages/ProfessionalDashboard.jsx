import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  ConfirmationModal,
  CurrentServiceCard,
  QueueControlPanel,
  WaitingList,
} from "../components/professionalDashboard";
import {
  callNext,
  cancelEntry,
  createQueueSession,
  finishService,
  getProfessionalDashboard,
  refreshQueueCode,
  requeueEntry,
  setQueueStatus,
  startService,
  updateQueuePrefix,
  updateQueueTolerance,
} from "../services/queue";
import { subscribeToQueue } from "../services/queueSocket";

const EMPTY_DASHBOARD = {
  sessionId: null,
  businessName: "",
  ticketCode: null,
  isActive: false,
  toleranceMinutes: null,
  activeQueue: [],
};

const findCurrentEntry = (entries = []) =>
  entries.find((entry) => ["CALLED", "IN_SERVICE"].includes(entry.status)) ||
  null;

const isSessionNotFound = (error) =>
  error.status === 404 && error.data?.errorCode === "SESSION_NOT_FOUND";

const mergeQueueDetails = (previousEntries = [], nextEntries = []) =>
  nextEntries.map((nextEntry) => {
    const previousEntry =
      previousEntries.find(
        (entry) => String(entry.id) === String(nextEntry.id),
      ) ||
      (nextEntry.userId &&
        previousEntries.find(
          (entry) => String(entry.userId) === String(nextEntry.userId),
        ));
    if (!previousEntry) return nextEntry;
    return {
      ...previousEntry,
      ...nextEntry,
      clientName: nextEntry.clientName || previousEntry.clientName,
      serviceName: nextEntry.serviceName || previousEntry.serviceName,
    };
  });

export default function ProfessionalDashboard() {
  const isRefreshing = useRef(false);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingPrefix, setEditingPrefix] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [editingTolerance, setEditingTolerance] = useState(false);
  const [toleranceMinutes, setToleranceMinutes] = useState("");
  const [toleranceError, setToleranceError] = useState("");
  const [prefixError, setPrefixError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  async function refresh({ silent = false } = {}) {
    if (isRefreshing.current) return;
    isRefreshing.current = true;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      let persistedDashboard = await getProfessionalDashboard();
      setDashboard((currentDashboard) => {
        const nextDashboard = persistedDashboard || EMPTY_DASHBOARD;
        return {
          ...nextDashboard,
          activeQueue: mergeQueueDetails(
            currentDashboard?.activeQueue,
            nextDashboard.activeQueue,
          ),
        };
      });
    } catch (requestError) {
      if (isSessionNotFound(requestError)) {
        setDashboard(EMPTY_DASHBOARD);
      } else if (!silent) {
        setError(requestError.message);
      }
    } finally {
      isRefreshing.current = false;
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    function handleProfileUpdated(event) {
      const businessName = event.detail?.businessName?.trim();
      if (!businessName) return;
      setDashboard((currentDashboard) =>
        currentDashboard
          ? { ...currentDashboard, businessName }
          : currentDashboard,
      );
    }

    window.addEventListener("barberflow:profile-updated", handleProfileUpdated);
    return () =>
      window.removeEventListener(
        "barberflow:profile-updated",
        handleProfileUpdated,
      );
  }, []);

  useEffect(() => {
    if (!dashboard?.sessionId) return undefined;
    return subscribeToQueue(
      dashboard.sessionId,
      (activeQueue, { partial = false } = {}) =>
        setDashboard((currentDashboard) => {
          if (!currentDashboard) return currentDashboard;
          if (!partial)
            return {
              ...currentDashboard,
              activeQueue: mergeQueueDetails(
                currentDashboard.activeQueue,
                activeQueue,
              ),
            };
          const updatedIds = new Set(
            activeQueue.map((entry) => String(entry.id)),
          );
          const unchangedEntries = currentDashboard.activeQueue.filter(
            (entry) => !updatedIds.has(String(entry.id)),
          );
          return {
            ...currentDashboard,
            activeQueue: [
              ...unchangedEntries,
              ...mergeQueueDetails(currentDashboard.activeQueue, activeQueue),
            ],
          };
        }),
      (socketError) => setError(socketError.message),
    );
  }, [dashboard?.sessionId]);

  async function run(action) {
    setLoading(true);
    setError("");
    try {
      return await action();
    } catch (requestError) {
      setError(requestError.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  const waiting = (
    dashboard?.activeQueue?.filter((entry) => entry.status === "WAITING") || []
  ).sort((first, second) => Number(first.position) - Number(second.position));
  const current = findCurrentEntry(dashboard?.activeQueue);
  const hasSession = Boolean(dashboard?.sessionId);

  function replaceQueueEntry(updatedEntry) {
    if (!updatedEntry?.id) return;
    setDashboard((currentDashboard) =>
      currentDashboard
        ? {
            ...currentDashboard,
            activeQueue: currentDashboard.activeQueue.map((queueEntry) =>
              String(queueEntry.id) === String(updatedEntry.id)
                ? { ...queueEntry, ...updatedEntry }
                : queueEntry,
            ),
          }
        : currentDashboard,
    );
  }

  function removeQueueEntry(entryId) {
    setDashboard((currentDashboard) =>
      currentDashboard
        ? {
            ...currentDashboard,
            activeQueue: currentDashboard.activeQueue.filter(
              (queueEntry) => String(queueEntry.id) !== String(entryId),
            ),
          }
        : currentDashboard,
    );
  }

  async function handleCancel() {
    if (!current) return;
    setConfirmation({
      title: "Cancelar cliente",
      message: `Deseja cancelar a vez de ${current.clientName}?`,
      confirmLabel: "Sim, cancelar",
      danger: true,
      action: () =>
        run(async () => {
          await cancelEntry(current.id);
          removeQueueEntry(current.id);
        }),
    });
  }

  function preserveRequeuedEntry(previousEntry, requeuedEntry) {
    const restoredEntry = {
      ...previousEntry,
      ...requeuedEntry,
      clientName: requeuedEntry?.clientName || previousEntry.clientName,
      serviceName: requeuedEntry?.serviceName || previousEntry.serviceName,
    };
    setDashboard((currentDashboard) =>
      currentDashboard
        ? {
            ...currentDashboard,
            activeQueue: [
              ...currentDashboard.activeQueue.filter(
                (entry) => String(entry.id) !== String(previousEntry.id),
              ),
              restoredEntry,
            ],
          }
        : currentDashboard,
    );
  }

  async function handleRequeue() {
    if (!current) return;
    setConfirmation({
      title: "Realocar cliente",
      message: `Deseja devolver ${current.clientName} para a fila como ausente?`,
      confirmLabel: "Sim, realocar",
      action: () =>
        run(async () => {
          const requeuedEntry = await requeueEntry(current.id);
          preserveRequeuedEntry(
            current,
            requeuedEntry?.id
              ? requeuedEntry
              : { ...current, status: "WAITING" },
          );
        }),
    });
  }

  function handleCallNext() {
    const nextClient = waiting[0];
    if (!nextClient) return;
    setConfirmation({
      title: "Chamar próximo",
      message: `Deseja chamar ${nextClient.clientName || "o próximo cliente"} para atendimento?`,
      confirmLabel: "Sim, chamar",
      action: () =>
        run(async () => {
          const calledEntry = await callNext(dashboard.sessionId);
          replaceQueueEntry(
            calledEntry?.id
              ? calledEntry
              : { ...nextClient, status: "CALLED" },
          );
        }),
    });
  }

  function handleStartService() {
    if (!current) return;
    setConfirmation({
      title: "Iniciar atendimento",
      message: `Deseja iniciar o atendimento de ${current.clientName}?`,
      confirmLabel: "Sim, iniciar",
      action: () =>
        run(async () => {
          const startedEntry = await startService(current.id);
          replaceQueueEntry(
            startedEntry?.id
              ? startedEntry
              : { ...current, status: "IN_SERVICE" },
          );
        }),
    });
  }

  async function handleConfirmAction() {
    const action = confirmation?.action;
    setConfirmation(null);
    if (action) await action();
  }

  function handlePrefixChange(event) {
    setPrefix(event.target.value.toUpperCase());
    setPrefixError("");
  }

  function closeSettings() {
    setSettingsOpen(false);
    setEditingPrefix(false);
    setEditingTolerance(false);
    setPrefix("");
    setToleranceMinutes("");
    setPrefixError("");
    setToleranceError("");
  }

  function handlePrefixSubmit(event) {
    event.preventDefault();
    if (!/^[A-Za-z0-9]{2,6}$/.test(prefix)) {
      setPrefixError(
        "Use de 2 a 6 letras ou números, sem espaços, acentos ou símbolos.",
      );
      return;
    }

    const nextPrefix = prefix;
    setConfirmation({
      title: "Salvar prefixo",
      message: `Deseja alterar o prefixo da fila para ${nextPrefix}?`,
      confirmLabel: "Sim, salvar",
      action: async () => {
        setLoading(true);
        setPrefixError("");
        try {
          const updatedSession = await updateQueuePrefix(nextPrefix);
          setDashboard((currentDashboard) =>
            currentDashboard
              ? {
                  ...currentDashboard,
                  ...updatedSession,
                  sessionId: updatedSession?.id || currentDashboard.sessionId,
                }
              : currentDashboard,
          );
          setPrefix("");
          setEditingPrefix(false);
        } catch (requestError) {
          setPrefixError(requestError.message);
        } finally {
          setLoading(false);
        }
      },
    });
  }

  function handleRefreshCode() {
    setConfirmation({
      title: "Alterar ticket",
      message:
        "Deseja gerar um novo ticket? O código atual deixará de ser válido.",
      confirmLabel: "Sim, gerar ticket",
      action: () =>
        run(async () => {
          const updatedSession = await refreshQueueCode();
          setDashboard((currentDashboard) =>
            currentDashboard
              ? {
                  ...currentDashboard,
                  ...updatedSession,
                  sessionId: updatedSession?.id || currentDashboard.sessionId,
                }
              : currentDashboard,
          );
        }),
    });
  }

  function handleFinishService() {
    if (!current) return;
    setConfirmation({
      title: "Finalizar atendimento",
      message: `Confirma a finalização do atendimento de ${current.clientName}?`,
      confirmLabel: "Sim, finalizar",
      action: () =>
        run(async () => {
          const finishedEntry = await finishService(current.id);
          replaceQueueEntry(
            finishedEntry?.id
              ? finishedEntry
              : { ...current, status: "FINISHED" },
          );
        }),
    });
  }

  function handleToggleStatus() {
    const opening = !dashboard.isActive;
    setConfirmation({
      title: opening ? "Abrir fila" : "Fechar fila",
      message: opening
        ? "Deseja abrir a fila para receber novos clientes?"
        : "Deseja fechar a fila? Novos clientes não poderão entrar.",
      confirmLabel: opening ? "Sim, abrir" : "Sim, fechar",
      danger: !opening,
      action: () =>
        run(async () => {
          const updatedSession = await setQueueStatus(opening);
          setDashboard((currentDashboard) =>
            currentDashboard
              ? {
                  ...currentDashboard,
                  ...updatedSession,
                  isActive: opening,
                  sessionId: updatedSession?.id || currentDashboard.sessionId,
                }
              : currentDashboard,
          );
        }),
    });
  }

  function handleCreateQueue() {
    setConfirmation({
      title: "Criar fila",
      message: "Deseja criar sua fila de atendimento agora?",
      confirmLabel: "Sim, criar fila",
      action: () =>
        run(async () => {
          await createQueueSession();
          const createdDashboard = await getProfessionalDashboard();
          setDashboard(createdDashboard || EMPTY_DASHBOARD);
        }),
    });
  }

  function handleToleranceSubmit(event) {
    event.preventDefault();
    const value = Number(toleranceMinutes);
    if (!Number.isInteger(value) || value < 1) {
      setToleranceError(
        "Informe uma quantidade inteira de minutos, a partir de 1.",
      );
      return;
    }

    setConfirmation({
      title: "Salvar tolerância",
      message: `Deseja alterar o tempo de tolerância para ${value} minuto${value === 1 ? "" : "s"}?`,
      confirmLabel: "Sim, salvar",
      action: async () => {
        setLoading(true);
        setToleranceError("");
        try {
          const updatedSession = await updateQueueTolerance(value);
          setDashboard((currentDashboard) =>
            currentDashboard
              ? {
                  ...currentDashboard,
                  ...updatedSession,
                  toleranceMinutes: value,
                  sessionId: updatedSession?.id || currentDashboard.sessionId,
                }
              : currentDashboard,
          );
          setToleranceMinutes("");
          setEditingTolerance(false);
        } catch (requestError) {
          setToleranceError(requestError.message);
        } finally {
          setLoading(false);
        }
      },
    });
  }

  return (
    <DashboardLayout>
      <main className="salon-main">
        {confirmation && (
          <ConfirmationModal
            confirmation={confirmation}
            loading={loading}
            onBack={() => setConfirmation(null)}
            onConfirm={handleConfirmAction}
          />
        )}
        <div className="panel-heading">
          <div>
            <span className="step">PAINEL PROFISSIONAL</span>
            <h1>{dashboard?.businessName || "Atendimento"}</h1>
          </div>
        </div>
        {error && (
          <div className="login-auth-error" role="alert">
            {error}
          </div>
        )}
        {dashboard && !hasSession && (
          <section className="profile-card queue-create-card">
            <span className="step">FILA DE ATENDIMENTO</span>
            <h2>Crie sua primeira fila</h2>
            <p>Uma fila só será criada quando você solicitar.</p>
            <button
              className="login-auth-submit"
              type="button"
              disabled={loading}
              onClick={handleCreateQueue}
            >
              Criar fila
            </button>
          </section>
        )}
        {dashboard && hasSession && (
          <QueueControlPanel
            dashboard={dashboard}
            loading={loading}
            settingsOpen={settingsOpen}
            editingPrefix={editingPrefix}
            prefix={prefix}
            prefixError={prefixError}
            editingTolerance={editingTolerance}
            toleranceMinutes={toleranceMinutes}
            toleranceError={toleranceError}
            onCloseSettings={closeSettings}
            onToggleSettings={() =>
              settingsOpen ? closeSettings() : setSettingsOpen(true)
            }
            onStartPrefixEdit={() => setEditingPrefix(true)}
            onPrefixChange={handlePrefixChange}
            onPrefixSubmit={handlePrefixSubmit}
            onCancelPrefixEdit={() => {
              setEditingPrefix(false);
              setPrefix("");
              setPrefixError("");
            }}
            onStartToleranceEdit={() => {
              setEditingTolerance(true);
              setToleranceMinutes(String(dashboard.toleranceMinutes || ""));
            }}
            onToleranceChange={(event) => {
              setToleranceMinutes(event.target.value);
              setToleranceError("");
            }}
            onToleranceSubmit={handleToleranceSubmit}
            onCancelToleranceEdit={() => {
              setEditingTolerance(false);
              setToleranceMinutes("");
              setToleranceError("");
            }}
            onRefreshCode={handleRefreshCode}
            onToggleStatus={handleToggleStatus}
          />
        )}
        {dashboard && hasSession && (
          <section className="salon-grid">
            <CurrentServiceCard
              current={current}
              waiting={waiting}
              isActive={dashboard.isActive}
              loading={loading}
              onCallNext={handleCallNext}
              onStart={handleStartService}
              onFinish={handleFinishService}
              onCancel={handleCancel}
              onRequeue={handleRequeue}
            />
            <WaitingList waiting={waiting} />
          </section>
        )}
      </main>
    </DashboardLayout>
  );
}
