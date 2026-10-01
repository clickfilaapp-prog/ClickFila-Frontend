import React from "react";
import {
  CheckCircle2,
  CircleX,
  PauseCircle,
  Store,
  Ticket,
  UsersRound,
} from "lucide-react";

export default function QueueFinder({
  ticketCode,
  setTicketCode,
  serviceName,
  setServiceName,
  queue,
  peopleInQueue,
  message,
  messageKind = "error",
  loading,
  onSearch,
  onJoin,
  onBackToSearch,
}) {
  const queueStatus = String(queue?.status || "").toUpperCase();
  const isPaused = queueStatus === "PAUSED";
  const hasClosedQueueMessage = String(message || "")
    .toLowerCase()
    .includes("fila está fechada");
  const isClosed = Boolean(queue) && (!queue.isActive || hasClosedQueueMessage);
  const queuePreviewState = isPaused
    ? "queue-preview-paused"
    : isClosed
      ? "queue-preview-closed"
      : "";

  return (
    <section className="code-screen">
      <div className="card-icon light">
        <Ticket size={25} />
      </div>
      <span className="step">ÁREA DO CLIENTE</span>
      {!queue && <h1>Encontre sua fila</h1>}
      {message && (
        <div
          className={
            messageKind === "success"
              ? "login-auth-success"
              : "login-auth-error"
          }
          role="status"
        >
          {message}
        </div>
      )}
      {!queue && (
        <form className="queue-code-field" data-tour="client-ticket-search" onSubmit={onSearch}>
          <input
            aria-label="Código da fila"
            required
            value={ticketCode}
            onChange={(event) =>
              setTicketCode(event.target.value.toUpperCase())
            }
            placeholder="Digite o token da fila"
            autoComplete="off"
          />
          <small>Digite o token fornecido pelo estabelecimento.</small>
          <button
            className="login-auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar fila"}
          </button>
        </form>
      )}
      {queue && (
        <div
          data-tour="client-join"
          className={`queue-preview ${queuePreviewState}`}
        >
          <div className="client-queue-stats">
            <article>
              <Store size={20} />
              <span>Estabelecimento</span>
              <strong>{queue.businessName}</strong>
            </article>
            <article>
              <UsersRound size={20} />
              <span>Pessoas na fila</span>
              <strong>{peopleInQueue}</strong>
            </article>
            <article>
              {isPaused ? (
                <PauseCircle size={20} aria-hidden="true" />
              ) : !isClosed ? (
                <CheckCircle2 size={20} aria-hidden="true" />
              ) : (
                <CircleX size={20} aria-hidden="true" />
              )}
              <span>Status</span>
              <strong>
                {isPaused ? "Pausada" : isClosed ? "Fechada" : "Aberta"}
              </strong>
            </article>
          </div>
          {!isClosed && !isPaused && (
            <form className="login-auth-form" onSubmit={onJoin}>
              <p>Confira a quantidade de pessoas e decida se deseja entrar.</p>
              <input
                className="service-description-field"
                aria-label="Serviço desejado"
                required
                value={serviceName}
                onChange={(event) => setServiceName(event.target.value)}
                placeholder="Descreva o serviço desejado"
              />
              <button className="login-auth-submit" disabled={loading}>
                {loading ? "Entrando..." : "Entrar na fila"}
              </button>
            </form>
          )}
          {(isClosed || isPaused) && (
            <button
              className="login-auth-submit"
              type="button"
              onClick={onBackToSearch}
            >
              Voltar e buscar outra fila
            </button>
          )}
        </div>
      )}
    </section>
  );
}
