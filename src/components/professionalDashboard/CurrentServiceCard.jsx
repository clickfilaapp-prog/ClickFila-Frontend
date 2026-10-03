import React, { useEffect, useState } from "react";
import { RotateCcw, Ticket } from "lucide-react";

function getRemainingSeconds(toleranceExpiresAt) {
  const expirationTime = new Date(toleranceExpiresAt).getTime();
  if (!Number.isFinite(expirationTime)) return 0;
  return Math.max(0, Math.ceil((expirationTime - Date.now()) / 1000));
}

function CallCountdown({ toleranceExpiresAt, onExpired }) {
  const [totalSeconds, setTotalSeconds] = useState(() =>
    getRemainingSeconds(toleranceExpiresAt),
  );

  useEffect(() => {
    const updateCountdown = () =>
      setTotalSeconds(getRemainingSeconds(toleranceExpiresAt));

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [toleranceExpiresAt]);

  useEffect(() => {
    if (totalSeconds === 0) onExpired?.();
  }, [totalSeconds, onExpired]);

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
    current?.status === "CALLED" && current.toleranceExpiresAt;

  if (!current) {
    return (
      <article className="now-card" data-tour="professional-service">
        <div className="nobody">
          <Ticket size={34} aria-hidden="true" />
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
    <article data-tour="professional-service" className={`now-card status-${current.status.toLowerCase().replace("_", "-")}`}>
      <Ticket size={34} aria-hidden="true" />
      <span className="step">ATENDIMENTO ATUAL</span>
      <h2>{current.clientName}</h2>
      <div className="current-service">
        <span>
          <Ticket size={16} aria-hidden="true" />
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
              className="cancel-call requeue-action"
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
