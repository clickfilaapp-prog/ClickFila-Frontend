import React, { useEffect, useMemo, useRef, useState } from "react";
import { Building2, LogOut, UserPlus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  ConfirmationModal,
  CurrentServiceCard,
  InviteAlertModal,
  MemberSelectionModal,
  PendingInvites,
  prepareCallCountdown,
  QueueControlPanel,
  TeamManagement,
  WaitingList,
} from "../components/professionalDashboard";
import {
  callNext,
  cancelEntry,
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
import {
  acceptTeamInvite,
  createQuickTeamMember,
  declineTeamInvite,
  leaveTeam,
  removeTeamMember,
  sendTeamInvite,
} from "../services/team";

const EMPTY_DASHBOARD = {
  businessId: null,
  sessionId: null,
  businessName: "",
  ticketCode: null,
  isActive: false,
  toleranceMinutes: null,
  activeQueue: [],
  team: [],
  pendingInvites: [],
};

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
  const navigate = useNavigate();
  const location = useLocation();
  const isRefreshing = useRef(false);
  const showedInviteAlert = useRef(false);
  const previousActiveEntryIds = useRef(new Set());
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
  const [selectingMember, setSelectingMember] = useState(false);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || "");
  const [inviteAlert, setInviteAlert] = useState(null);
  const [teamManagementOpen, setTeamManagementOpen] = useState(false);
  const [sentInvites, setSentInvites] = useState([]);
  const [selectedActiveEntryId, setSelectedActiveEntryId] = useState("");
  const [expiredCountdowns, setExpiredCountdowns] = useState(() => new Set());

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
    if (!location.state?.message) return;
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, location.state?.message, navigate]);

  useEffect(() => {
    if (
      !showedInviteAlert.current &&
      !dashboard?.businessId &&
      dashboard?.pendingInvites?.length
    ) {
      showedInviteAlert.current = true;
      setInviteAlert(dashboard.pendingInvites[0]);
    }
  }, [dashboard]);

  useEffect(() => {
    if (
      dashboard &&
      !dashboard.businessId &&
      !(dashboard.pendingInvites || []).length
    ) {
      navigate("/professional/business/new", { replace: true });
    }
  }, [dashboard, navigate]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

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

  async function reloadDashboard() {
    const updatedDashboard = await getProfessionalDashboard({ force: true });
    setDashboard(updatedDashboard || EMPTY_DASHBOARD);
  }

  async function handleAcceptInvite(invite) {
    setInviteAlert(null);
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await acceptTeamInvite(invite.id);
      await reloadDashboard();
      setSuccessMessage("Bem-vindo à equipe!");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDeclineInvite(invite) {
    setInviteAlert(null);
    setConfirmation({
      title: "Recusar convite",
      message: `Deseja recusar o convite de ${invite.businessName}?`,
      confirmLabel: "Sim, recusar",
      danger: true,
      action: () =>
        run(async () => {
          await declineTeamInvite(invite.id);
          setDashboard((currentDashboard) => ({
            ...currentDashboard,
            pendingInvites: currentDashboard.pendingInvites.filter(
              (pendingInvite) => pendingInvite.id !== invite.id,
            ),
          }));
          setSuccessMessage("Convite recusado.");
        }),
    });
  }

  async function handleSendInvite(email) {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const invite = await sendTeamInvite(email);
      if (invite?.id) {
        setSentInvites((current) => [invite, ...current.filter((item) => item.id !== invite.id)]);
      }
      setSuccessMessage(`Convite enviado para ${invite?.email || email}.`);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAdd(name) {
    if (name.trim().length < 2) return false;
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const member = await createQuickTeamMember(name);
      setDashboard((currentDashboard) => ({
        ...currentDashboard,
        team: member?.id
          ? [...currentDashboard.team.filter((item) => item.id !== member.id), member]
          : currentDashboard.team,
      }));
      await reloadDashboard();
      setSuccessMessage(`${member?.name || name} foi adicionado à equipe.`);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  function handleRemoveTeamMember(member) {
    if (busyMemberIds.has(String(member.id))) {
      setConfirmation({
        title: "Profissional em atendimento",
        message:
          `${member.name} está com um atendimento ativo. Finalize ou cancele ` +
          "esse atendimento antes de remover o profissional da equipe.",
        backLabel: "Entendi",
        hideConfirm: true,
      });
      return;
    }
    setConfirmation({
      title: "Remover profissional",
      message:
        `Deseja remover ${member.name} da equipe? ` +
        "O profissional deixará de aparecer no modo quiosque.",
      confirmLabel: "Sim, remover",
      danger: true,
      action: () =>
        run(async () => {
          await removeTeamMember(member.id);
          setDashboard((currentDashboard) => ({
            ...currentDashboard,
            team: currentDashboard.team.filter(
              (teamMember) => String(teamMember.id) !== String(member.id),
            ),
          }));
          setSuccessMessage(`${member.name} foi removido da equipe.`);
        }),
    });
  }

  function handleLeaveTeam() {
    setConfirmation({
      title: "Sair da equipe",
      message:
        `Deseja realmente sair da equipe ${dashboard.businessName || "atual"}? ` +
        "Você perderá o acesso à fila e aos atendimentos desta barbearia.",
      confirmLabel: "Sim, sair da equipe",
      danger: true,
      action: () =>
        run(async () => {
          await leaveTeam();
          navigate("/professional/business/new", {
            replace: true,
            state: { message: "Você saiu da equipe com sucesso." },
          });
        }),
    });
  }

  const waiting = (
    dashboard?.activeQueue?.filter((entry) => entry.status === "WAITING") || []
  ).sort((first, second) => Number(first.position) - Number(second.position));
  const activeServices = useMemo(
    () =>
      (dashboard?.activeQueue || []).filter((entry) =>
        ["CALLED", "IN_SERVICE"].includes(entry.status),
      ),
    [dashboard?.activeQueue],
  );
  const selectedActiveService =
    activeServices.find(
      (entry) => String(entry.id) === String(selectedActiveEntryId),
    ) || activeServices[0] || null;
  const selectedServiceColorState = selectedActiveService
    ? selectedActiveService.status === "IN_SERVICE"
      ? "is-in-service"
      : expiredCountdowns.has(
            `${selectedActiveService.id}:${selectedActiveService.toleranceExpiresAt || ""}`,
          )
        ? "is-expired"
        : "is-running"
    : "";
  const hasBusiness = Boolean(dashboard?.businessId);
  const hasSession = Boolean(dashboard?.sessionId);
  const busyMemberIds = new Set(
    (dashboard?.activeQueue || [])
      .filter((entry) => ["CALLED", "IN_SERVICE"].includes(entry.status))
      .map((entry) => String(entry.servedByMemberId || ""))
      .filter(Boolean),
  );
  const availableTeam = (dashboard?.team || []).filter(
    (member) => !busyMemberIds.has(String(member.id)),
  );

  useEffect(() => {
    activeServices.forEach(prepareCallCountdown);
  }, [activeServices]);

  useEffect(() => {
    const currentIds = new Set(
      activeServices.map((entry) => String(entry.id)),
    );
    const newlyCalledEntries = activeServices.filter(
      (entry) => !previousActiveEntryIds.current.has(String(entry.id)),
    );

    if (!activeServices.length) {
      setSelectedActiveEntryId("");
      previousActiveEntryIds.current = currentIds;
      return;
    }

    if (newlyCalledEntries.length) {
      setSelectedActiveEntryId(
        String(newlyCalledEntries[newlyCalledEntries.length - 1].id),
      );
    } else if (
      !activeServices.some(
        (entry) => String(entry.id) === String(selectedActiveEntryId),
      )
    ) {
      setSelectedActiveEntryId(String(activeServices[0].id));
    }

    previousActiveEntryIds.current = currentIds;
  }, [activeServices, selectedActiveEntryId]);


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

  async function handleCancel(targetEntry) {
    if (!targetEntry) return;
    setConfirmation({
      title: "Cancelar cliente",
      message: `Deseja cancelar a vez de ${targetEntry.clientName}?`,
      confirmLabel: "Sim, cancelar",
      danger: true,
      action: () =>
        run(async () => {
          await cancelEntry(targetEntry.id);
          removeQueueEntry(targetEntry.id);
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

  async function handleRequeue(targetEntry) {
    if (!targetEntry) return;
    setConfirmation({
      title: "Realocar cliente",
      message: `Deseja devolver ${targetEntry.clientName} para a fila como ausente?`,
      confirmLabel: "Sim, realocar",
      action: () =>
        run(async () => {
          const requeuedEntry = await requeueEntry(targetEntry.id);
          preserveRequeuedEntry(
            targetEntry,
            requeuedEntry?.id
              ? requeuedEntry
              : { ...targetEntry, status: "WAITING" },
          );
        }),
    });
  }

  function handleCallNext() {
    const nextClient = waiting[0];
    if (!nextClient) return;
    setSelectingMember(true);
  }

  function handleMemberSelection(member) {
    const nextClient = waiting[0];
    if (!nextClient || !member?.id) return;
    setSelectingMember(false);
    setConfirmation({
      title: "Chamar próximo",
      message:
        `${member.name} deseja chamar ` +
        `${nextClient.clientName || "o próximo cliente"} para atendimento?`,
      confirmLabel: "Sim, chamar",
      action: () =>
        run(async () => {
          const calledEntry = await callNext(dashboard.sessionId, member.id);
          replaceQueueEntry(
            calledEntry?.id
              ? calledEntry
              : { ...nextClient, status: "CALLED" },
          );
        }),
    });
  }

  function handleStartService(targetEntry) {
    if (!targetEntry) return;
    setConfirmation({
      title: "Iniciar atendimento",
      message: `Deseja iniciar o atendimento de ${targetEntry.clientName}?`,
      confirmLabel: "Sim, iniciar",
      action: () =>
        run(async () => {
          const startedEntry = await startService(targetEntry.id);
          replaceQueueEntry(
            startedEntry?.id
              ? startedEntry
              : { ...targetEntry, status: "IN_SERVICE" },
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

  function handleFinishService(targetEntry) {
    if (!targetEntry) return;
    setConfirmation({
      title: "Finalizar atendimento",
      message: `Confirma a finalização do atendimento de ${targetEntry.clientName}?`,
      confirmLabel: "Sim, finalizar",
      action: () =>
        run(async () => {
          const finishedEntry = await finishService(targetEntry.id);
          replaceQueueEntry(
            finishedEntry?.id
              ? finishedEntry
              : { ...targetEntry, status: "FINISHED" },
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

  function handleOpenInvites() {
    const firstInvite = dashboard?.pendingInvites?.[0];
    if (firstInvite) {
      setInviteAlert(firstInvite);
      return;
    }
    setSuccessMessage("Você não possui convites pendentes.");
  }

  return (
    <DashboardLayout
      showInvites
      pendingInviteCount={dashboard?.pendingInvites?.length || 0}
      onOpenInvites={handleOpenInvites}
    >
      <main className="salon-main">
        {confirmation && (
          <ConfirmationModal
            confirmation={confirmation}
            loading={loading}
            onBack={() => setConfirmation(null)}
            onConfirm={handleConfirmAction}
          />
        )}
        {selectingMember && (
          <MemberSelectionModal
            team={availableTeam}
            loading={loading}
            onClose={() => setSelectingMember(false)}
            onSelect={handleMemberSelection}
          />
        )}
        {inviteAlert && (
          <InviteAlertModal
            invite={inviteAlert}
            loading={loading}
            onClose={() => setInviteAlert(null)}
            onAccept={handleAcceptInvite}
            onDecline={handleDeclineInvite}
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
        {successMessage && (
          <div className="toast" role="status" aria-live="polite">{successMessage}</div>
        )}
        {dashboard && (
          <PendingInvites
            invites={dashboard.pendingInvites || []}
            loading={loading}
            onAccept={handleAcceptInvite}
            onDecline={handleDeclineInvite}
          />
        )}
        {dashboard &&
          !hasBusiness &&
          (dashboard.pendingInvites || []).length > 0 && (
          <section className="professional-welcome-card">
            <div className="welcome-business-icon"><Building2 size={38} /></div>
            <span className="step">BEM-VINDO AO CLICKFILA</span>
            <h2>Seu próximo passo começa agora.</h2>
            <p>
              Crie seu próprio negócio para organizar a fila, montar sua equipe
              e oferecer uma experiência melhor aos clientes.
            </p>
            <button
              className="welcome-primary-action"
              type="button"
              onClick={() => navigate("/professional/business/new")}
            >
              <UserPlus size={20} /> Criar Meu Negócio
            </button>
          </section>
        )}
        {dashboard && hasBusiness && hasSession && (
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
        {dashboard && hasBusiness && hasSession && (
          <section className="salon-grid">
            <div className="active-service-list">
              {activeServices.length ? (
                <>
                  <div
                    className={`active-professional-selector ${selectedServiceColorState}`}
                  >
                    <label htmlFor="active-professional">
                      Acompanhar atendimento
                    </label>
                    <select
                      id="active-professional"
                      value={String(selectedActiveService?.id || "")}
                      onChange={(event) =>
                        setSelectedActiveEntryId(event.target.value)
                      }
                    >
                      {activeServices.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.servedByMemberName || "Profissional não identificado"} — {entry.clientName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <CurrentServiceCard
                    key={selectedActiveService.id}
                    current={selectedActiveService}
                    waiting={waiting}
                    isActive={dashboard.isActive}
                    loading={loading}
                    onCallNext={handleCallNext}
                    onStart={() => handleStartService(selectedActiveService)}
                    onFinish={() => handleFinishService(selectedActiveService)}
                    onCancel={() => handleCancel(selectedActiveService)}
                    onRequeue={() => handleRequeue(selectedActiveService)}
                    onCountdownExpired={() =>
                      setExpiredCountdowns((currentCountdowns) => {
                        const countdownKey =
                          `${selectedActiveService.id}:` +
                          `${selectedActiveService.toleranceExpiresAt || ""}`;
                        if (currentCountdowns.has(countdownKey)) {
                          return currentCountdowns;
                        }
                        const nextCountdowns = new Set(currentCountdowns);
                        nextCountdowns.add(countdownKey);
                        return nextCountdowns;
                      })
                    }
                  />
                </>
              ) : (
                <CurrentServiceCard
                  current={null}
                  waiting={waiting}
                  isActive={dashboard.isActive}
                  loading={loading}
                  onCallNext={handleCallNext}
                />
              )}
            </div>
            <WaitingList waiting={waiting} />
          </section>
        )}
        {dashboard && hasBusiness && dashboard.loggedMemberRole === "OWNER" && (
          <section className="team-management-shell">
            <button
              className="manage-team-trigger"
              type="button"
              onClick={() => setTeamManagementOpen((open) => !open)}
            >
              <UserPlus size={19} /> {teamManagementOpen ? "Fechar gestão da equipe" : "Gerenciar Equipe"}
            </button>
            {teamManagementOpen && (
              <TeamManagement
                team={dashboard.team || []}
                sentInvites={sentInvites}
                busyMemberIds={busyMemberIds}
                loading={loading}
                onInvite={handleSendInvite}
                onQuickAdd={handleQuickAdd}
                onRemove={handleRemoveTeamMember}
              />
            )}
          </section>
        )}
        {dashboard &&
          hasBusiness &&
          dashboard.loggedMemberRole &&
          dashboard.loggedMemberRole !== "OWNER" && (
            <section className="leave-team-shell">
              <button
                className="leave-team-trigger"
                type="button"
                disabled={loading}
                onClick={handleLeaveTeam}
              >
                <LogOut size={18} /> Sair da equipe
              </button>
            </section>
          )}
      </main>
    </DashboardLayout>
  );
}
