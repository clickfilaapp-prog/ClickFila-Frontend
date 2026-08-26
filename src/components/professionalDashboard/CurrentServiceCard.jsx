import React, { useEffect, useState } from "react";
import { RotateCcw, Scissors } from "lucide-react";

const countdownDeadlines = new Map();

function getCountdownDeadline(entryId, serverTimeNow, toleranceExpiresAt) {
  const key = `${entryId}:${toleranceExpiresAt}`;
  if (!countdownDeadlines.has(key)) {
    const remainingMilliseconds = Math.max(
      0,
      new Date(toleranceExpiresAt).getTime() - new Date(serverTimeNow).getTime(),
    );
    countdownDeadlines.set(key, Date.now() + remainingMilliseconds);
  }
  return { key, deadline: countdownDeadlines.get(key) };
}

export function prepareCallCountdown(entry) {
  if (
    entry?.status === "CALLED" &&
    entry.id &&
    entry.serverTimeNow &&
    entry.toleranceExpiresAt
  ) {
    getCountdownDeadline(
      entry.id,
      entry.serverTimeNow,
      entry.toleranceExpiresAt,
    );
  }
}

function CallCountdown({
  entryId,
  serverTimeNow,
  toleranceExpiresAt,
  onExpired,
}) {
  const { key, deadline } = getCountdownDeadline(
    entryId,
    serverTimeNow,
    toleranceExpiresAt,
  );
  const getRemainingSeconds = () =>
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  const [totalSeconds, setTotalSeconds] = useState(getRemainingSeconds);

  useEffect(() => {
    setTotalSeconds(getRemainingSeconds());
    const timer = window.setInterval(
      () => setTotalSeconds(getRemainingSeconds()),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [key, deadline]);

  useEffect(() => {
    if (totalSeconds === 0) onExpired?.();
  }, [totalSeconds]);

  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return (
    <div className={`call-countdown ${totalSeconds === 0 ? "is-expired" : "is-running"}`}>
      <div
        className={`salon-timer ${totalSeconds === 0 ? "expired" : ""}`}
        role="timer"
        aria-live="polite"
      >
        {minutes}:{seconds}
      </div>
      <span className="timer-caption">
        {totalSeconds === 0
          ? "Tempo de tolerância esgotado"
          : "Tempo de tolerância para comparecer"}
      </span>
    </div>
  );
}

export default function CurrentServiceCard({
  current,
  waiting,
  isActive,
  loading,
  onCallNext,
  onStart,
  onFinish,
  onCancel,
  onRequeue,
  onCountdownExpired,
}) {
  const hasCountdownData =
    current?.status === "CALLED" &&
    current.serverTimeNow &&
    current.toleranceExpiresAt;

  if (!current) {
    return (
      <article className="now-card">
        <div className="nobody">
          <Scissors size={34} />
          <h2>Nenhum atendimento em andamento</h2>
          <button
            className="next-after"
            disabled={loading || !isActive || !waiting.length}
            onClick={onCallNext}
          >
            Chamar próximo
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className={`now-card status-${current.status.toLowerCase().replace("_", "-")}`}>
      <Scissors size={34} />
      <span className="step">ATENDIMENTO ATUAL</span>
      <h2>{current.clientName}</h2>
      <div className="current-service">
        <span>
          <Scissors size={13} />
          SERVIÇO
        </span>
        <strong>{current.serviceName}</strong>
      </div>
      <p className="current-service-status">
        {current.status === "CALLED"
          ? "Cliente chamado"
          : "Atendimento em andamento"}
      </p>
      {current.servedByMemberName && (
        <p className="served-by-member">
          Atendimento por : <strong>{current.servedByMemberName}</strong>
        </p>
      )}
      {current.status === "CALLED" ? (
        <>
          {hasCountdownData ? (
            <CallCountdown
              entryId={current.id}
              serverTimeNow={current.serverTimeNow}
              toleranceExpiresAt={current.toleranceExpiresAt}
              onExpired={onCountdownExpired}
            />
          ) : (
            <span className="timer-caption">Sincronizando tolerância...</span>
          )}
          <div className="current-call-actions">
            <button className="next-after" disabled={loading} onClick={onStart}>
              Iniciar atendimento
            </button>
            <button
              className="cancel-call"
              disabled={loading}
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              className="cancel-call"
              disabled={loading}
              onClick={onRequeue}
            >
              <RotateCcw size={16} />
              Recolocar na fila / Ausente
            </button>
          </div>
        </>
      ) : (
        <button className="next-after" disabled={loading} onClick={onFinish}>
          Finalizar atendimento
        </button>
      )}
      {waiting.length > 0 && (
        <button
          className="call-another-client"
          type="button"
          disabled={loading || !isActive}
          onClick={onCallNext}
        >
          Chamar outro cliente
        </button>
      )}
    </article>
  );
}
