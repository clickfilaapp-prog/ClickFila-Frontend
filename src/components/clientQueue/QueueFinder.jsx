import React from "react";
import { Store, Ticket, UsersRound } from "lucide-react";

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
        <form className="queue-code-field" onSubmit={onSearch}>
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
          className={`queue-preview ${!queue.isActive ? "queue-preview-closed" : ""}`}
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
              <Ticket size={20} />
              <span>Status</span>
              <strong>{queue.isActive ? "Fila aberta" : "Fila fechada"}</strong>
            </article>
          </div>
          {queue.isActive && (
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
          {!queue.isActive && (
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
