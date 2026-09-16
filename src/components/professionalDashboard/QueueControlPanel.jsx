import React from "react";
import {
  Clock,
  Pencil,
  Power,
  RefreshCw,
  Settings,
  Ticket,
  X,
} from "lucide-react";

export default function QueueControlPanel({
  dashboard,
  loading,
  settingsOpen,
  editingPrefix,
  prefix,
  prefixError,
  editingTolerance,
  toleranceMinutes,
  toleranceError,
  onToggleStatus,
  onToggleSettings,
  onCloseSettings,
  onStartPrefixEdit,
  onPrefixChange,
  onPrefixSubmit,
  onCancelPrefixEdit,
  onRefreshCode,
  onStartToleranceEdit,
  onToleranceChange,
  onToleranceSubmit,
  onCancelToleranceEdit,
}) {
  return (
    <section className="issuer-panel" data-tour="professional-queue-control">
      <div className="issuer-copy">
        <div className="card-icon light">
          <Ticket size={23} />
        </div>
        <div>
          <span className="step">FILA DE ATENDIMENTO</span>
          <h2 data-tour="professional-ticket">{dashboard.ticketCode}</h2>
          <p>
            {dashboard.isActive
              ? "A fila está aberta."
              : "A fila está fechada."}
          </p>
        </div>
      </div>
      <div className="issuer-actions">
        <button
          data-tour="professional-toggle-queue"
          className={`queue-status-button ${dashboard.isActive ? "active" : "closed"}`}
          type="button"
          disabled={loading}
          onClick={onToggleStatus}
        >
          <Power size={17} />
          <span>{dashboard.isActive ? "Fechar fila" : "Abrir fila"}</span>
        </button>
        <button
          className="queue-settings-trigger"
          type="button"
          aria-label="Configurações da fila"
          aria-expanded={settingsOpen}
          onClick={onToggleSettings}
        >
          <Settings size={21} />
        </button>
        {settingsOpen && (
          <div className="queue-settings-menu">
            <div className="queue-settings-heading">
              <div>
                <span>CONFIGURAÇÕES</span>
                <strong>Gerenciar fila</strong>
              </div>
              <button
                type="button"
                aria-label="Fechar configurações"
                onClick={onCloseSettings}
              >
                <X size={17} />
              </button>
            </div>
            {editingPrefix ? (
              <form
                className="prefix-form"
                onSubmit={onPrefixSubmit}
                noValidate
              >
                <label htmlFor="queue-prefix">Novo prefixo</label>
                <div>
                  <input
                    id="queue-prefix"
                    name="prefix"
                    value={prefix}
                    onChange={onPrefixChange}
                    minLength={2}
                    maxLength={6}
                    pattern="[A-Za-z0-9]+"
                    required
                    autoFocus
                    aria-invalid={Boolean(prefixError)}
                    aria-describedby="prefix-help"
                    placeholder="VIP"
                  />
                  <button
                    type="submit"
                    className="generate-button"
                    disabled={loading}
                  >
                    Salvar
                  </button>
                </div>
                <small
                  id="prefix-help"
                  className={prefixError ? "prefix-error" : ""}
                >
                  {prefixError || "De 2 a 6 letras ou números."}
                </small>
                <button
                  type="button"
                  className="prefix-cancel"
                  disabled={loading}
                  onClick={onCancelPrefixEdit}
                >
                  Cancelar edição
                </button>
              </form>
            ) : (
              <button
                className="queue-setting-action"
                disabled={loading}
                onClick={onStartPrefixEdit}
              >
                <Pencil size={17} />
                <span>
                  <strong>Editar prefixo</strong>
                  <small>Personalize as letras do código</small>
                </span>
              </button>
            )}
            {editingTolerance ? (
              <form
                className="prefix-form"
                onSubmit={onToleranceSubmit}
                noValidate
              >
                <label htmlFor="queue-tolerance">
                  Tolerância para o próximo cliente
                </label>
                <div>
                  <input
                    id="queue-tolerance"
                    name="toleranceMinutes"
                    type="number"
                    value={toleranceMinutes}
                    onChange={onToleranceChange}
                    min="1"
                    step="1"
                    required
                    autoFocus
                    aria-invalid={Boolean(toleranceError)}
                    aria-describedby="tolerance-help"
                    placeholder="15"
                  />
                  <button
                    type="submit"
                    className="generate-button"
                    disabled={loading}
                  >
                    Salvar
                  </button>
                </div>
                <small
                  id="tolerance-help"
                  className={toleranceError ? "prefix-error" : ""}
                >
                  {toleranceError || "Tempo em minutos, a partir de 1."}
                </small>
                <button
                  type="button"
                  className="prefix-cancel"
                  disabled={loading}
                  onClick={onCancelToleranceEdit}
                >
                  Cancelar edição
                </button>
              </form>
            ) : (
              <button
                className="queue-setting-action"
                disabled={loading}
                onClick={onStartToleranceEdit}
              >
                <Clock size={17} />
                <span>
                  <strong>Editar tolerância</strong>
                  <small>
                    Atual: {dashboard.toleranceMinutes || "não definida"} min
                  </small>
                </span>
              </button>
            )}
            <button
              className="queue-setting-action"
              disabled={loading}
              onClick={onRefreshCode}
            >
              <RefreshCw size={17} />
              <span>
                <strong>Alterar ticket</strong>
                <small>Gerar um novo código para a fila</small>
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
