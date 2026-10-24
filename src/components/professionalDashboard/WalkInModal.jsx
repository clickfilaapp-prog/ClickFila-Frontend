import React, { useEffect, useRef, useState } from "react";
import { ClipboardPlus, Scissors, UserRound, X } from "lucide-react";

export default function WalkInModal({ loading, onClose, onSubmit }) {
  const [clientName, setClientName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [validationError, setValidationError] = useState("");
  const clientNameRef = useRef(null);

  useEffect(() => {
    clientNameRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [loading, onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextClientName = clientName.trim();
    const nextServiceName = serviceName.trim();

    if (!nextClientName || !nextServiceName) {
      setValidationError("Informe o nome do cliente e o serviço solicitado.");
      return;
    }

    const created = await onSubmit({
      clientName: nextClientName,
      serviceName: nextServiceName,
    });
    if (!created) return;

    setClientName("");
    setServiceName("");
  }

  return (
    <div
      className="confirmation-modal walk-in-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walk-in-modal-title"
    >
      <div>
        <button
          className="member-modal-close"
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Fechar cadastro de cliente"
        >
          <X size={20} />
        </button>
        <div className="walk-in-modal-icon" aria-hidden="true">
          <ClipboardPlus size={24} />
        </div>
        <h2 id="walk-in-modal-title">Adicionar cliente à fila</h2>
        <p>Cadastre o cliente para incluí-lo na fila de atendimento.</p>

        <form className="walk-in-form" onSubmit={handleSubmit}>
          <label>
            Nome do cliente
            <span className="input-wrap">
              <UserRound size={17} />
              <input
                ref={clientNameRef}
                type="text"
                value={clientName}
                onChange={(event) => {
                  setClientName(event.target.value);
                  setValidationError("");
                }}
                placeholder="Ex.: João da Silva"
                autoComplete="off"
                disabled={loading}
              />
            </span>
          </label>
          <label>
            Serviço solicitado
            <span className="input-wrap">
              <Scissors size={17} />
              <input
                type="text"
                value={serviceName}
                onChange={(event) => {
                  setServiceName(event.target.value);
                  setValidationError("");
                }}
                placeholder="Ex.: Corte de cabelo"
                autoComplete="off"
                disabled={loading}
              />
            </span>
          </label>
          {validationError && (
            <div className="walk-in-validation-error" role="alert">
              {validationError}
            </div>
          )}
          <div className="confirmation-actions">
            <button
              type="button"
              className="confirmation-back"
              disabled={loading}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="confirmation-accept success"
              disabled={loading}
            >
              {loading ? "Adicionando..." : "Adicionar à fila"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
