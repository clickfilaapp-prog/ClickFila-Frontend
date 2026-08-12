import React, { useEffect, useState } from "react";
import { RotateCcw, Scissors } from "lucide-react";

function CallCountdown({
  serverTimeNow,
  toleranceExpiresAt,
  toleranceMinute,
}) {
  const initialSeconds = Math.max(
    0,
    Math.ceil(
      (new Date(toleranceExpiresAt).getTime() -
        new Date(serverTimeNow).getTime()) /
        1000,
    ),
  );
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);

  useEffect(() => {
    setTotalSeconds(initialSeconds);
    const timer = window.setInterval(
      () => setTotalSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [initialSeconds]);

  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return (
    <>
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
      {totalSeconds > 0 && Number.isFinite(Number(toleranceMinute)) && (
        <span className="timer-caption">
          Você tem {toleranceMinute} minuto
          {Number(toleranceMinute) === 1 ? "" : "s"} para comparecer
        </span>
      )}
    </>
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
    <article className="now-card">
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
      <p>
        {current.status === "CALLED"
          ? "Cliente chamado"
          : "Atendimento em andamento"}
      </p>
      {current.status === "CALLED" ? (
        <>
          {hasCountdownData ? (
            <CallCountdown
              serverTimeNow={current.serverTimeNow}
              toleranceExpiresAt={current.toleranceExpiresAt}
              toleranceMinute={current.toleranceMinute}
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
    </article>
  );
}
