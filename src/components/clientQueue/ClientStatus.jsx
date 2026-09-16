import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Ticket } from "lucide-react";

const STATUS = {
  WAITING: {
    label: "Aguardando na fila",
    title: "Você está na fila",
    description:
      "Acompanhe sua posição. Esta tela é atualizada automaticamente.",
    step: 0,
  },
  CALLED: {
    label: "Você foi chamado!",
    title: "É a sua vez!",
    description: "Dirija-se ao profissional para iniciar o atendimento.",
    step: 1,
  },
  IN_SERVICE: {
    label: "Atendimento em andamento",
    title: "Você está sendo atendido",
    description: "Seu atendimento já começou.",
    step: 2,
  },
  FINISHED: {
    label: "Atendimento finalizado",
    title: "Atendimento concluído",
    description: "Obrigado por utilizar a fila.",
    step: 3,
  },
};

const TIMELINE = ["Na fila", "Chamado", "Em atendimento", "Finalizado"];

function ClientCallCountdown({ serverTimeNow, toleranceExpiresAt }) {
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

  return (
    <strong
      className={`client-position-timer ${totalSeconds === 0 ? "expired" : ""}`}
      role="timer"
    >
      <Clock3 size={22} />
      {String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:
      {String(totalSeconds % 60).padStart(2, "0")}
    </strong>
  );
}

export default function ClientStatus({
  entry,
  loading,
  message,
  onCancel,
  onFinish,
  onDone,
}) {
  const status = STATUS[entry.status] || STATUS.WAITING;
  const finished = entry.status === "FINISHED";
  const canShowTimer =
    entry.status === "CALLED" &&
    entry.serverTimeNow &&
    entry.toleranceExpiresAt;

  return (
    <section
      data-tour="client-status"
      className={`client-status-card status-${entry.status?.toLowerCase() || "waiting"}`}
      aria-live="polite"
    >
      <div className="client-status-icon">
        {finished ? (
          <CheckCircle2 size={30} />
        ) : entry.status === "IN_SERVICE" ? (
          <img className="app-symbol-icon" src="/favicon.png" alt="" width="30" height="30" />
        ) : (
          <Ticket size={30} />
        )}
      </div>
      <span className="step">ACOMPANHAMENTO EM TEMPO REAL</span>
      <h1>{status.title}</h1>
      <p>{status.description}</p>
      {!finished && (
        <div className="client-position">
          <span>
            {entry.status === "CALLED"
              ? "TEMPO PARA COMPARECER"
              : entry.status === "WAITING"
                ? "SUA POSIÇÃO"
                : "ATENDIMENTO"}
          </span>
          {entry.status === "CALLED" ? (
            canShowTimer ? (
              <ClientCallCountdown
                serverTimeNow={entry.serverTimeNow}
                toleranceExpiresAt={entry.toleranceExpiresAt}
              />
            ) : (
              <strong className="client-timer-syncing">
                <Clock3 size={22} />
                Sincronizando...
              </strong>
            )
          ) : (
            <strong>
              {entry.status === "WAITING" ? entry.position : "EM ANDAMENTO"}
            </strong>
          )}
          {entry.status === "CALLED" && (
            <small>
              {Number.isFinite(Number(entry.toleranceMinute))
                ? `Você tem ${entry.toleranceMinute} minuto${Number(entry.toleranceMinute) === 1 ? "" : "s"} para comparecer`
                : "Dirija-se ao profissional antes do tempo terminar"}
            </small>
          )}
        </div>
      )}
      <div className="client-status-label">
        <i />
        {status.label}
      </div>
      {message && (
        <div className="login-auth-error" role="status">
          {message}
        </div>
      )}
      <ol className="queue-timeline" aria-label="Etapas do atendimento">
        {TIMELINE.map((label, index) => (
          <li
            key={label}
            className={index <= status.step ? "complete" : ""}
            aria-current={index === status.step ? "step" : undefined}
          >
            <span>{index < status.step ? "✓" : index + 1}</span>
            <small>{label}</small>
          </li>
        ))}
      </ol>
      <div className="client-service-details">
        <div>
          <span>Cliente</span>
          <strong>{entry.clientName}</strong>
        </div>
        <div>
          <span>Serviço</span>
          <strong>{entry.serviceName}</strong>
        </div>
      </div>
      {finished ? (
        <button className="login-auth-submit" type="button" onClick={onDone}>
          Buscar outra fila
        </button>
      ) : entry.status === "IN_SERVICE" ? (
        <button
          className="login-auth-submit"
          type="button"
          disabled={loading}
          onClick={onFinish}
        >
          {loading ? "Finalizando..." : "Já fui atendido"}
        </button>
      ) : (
        <button
          className="cancel-queue"
          type="button"
          disabled={loading || !["WAITING", "CALLED"].includes(entry.status)}
          onClick={onCancel}
        >
          {loading ? "Saindo..." : "Sair da fila"}
        </button>
      )}
    </section>
  );
}
