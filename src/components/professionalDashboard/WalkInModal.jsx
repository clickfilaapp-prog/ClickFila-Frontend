import React, { useEffect, useRef, useState } from "react";
import { ClipboardPlus, Scissors, UserRound, X } from "lucide-react";

export default function WalkInModal({ loading, onClose, onSubmit }) {
  const [clientName, setClientName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [validationError, setValidationError] = useState("");
  const clientNameRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    let frameId;
    function syncWithKeyboard() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const modal = modalRef.current;
        if (!modal) return;

        modal.style.setProperty("--walk-in-viewport-height", `${viewport.height}px`);
        modal.style.setProperty("--walk-in-viewport-top", `${viewport.offsetTop}px`);

        const activeElement = document.activeElement;
        if (activeElement?.closest(".walk-in-form")) {
          activeElement.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      });
    }

    syncWithKeyboard();
    viewport.addEventListener("resize", syncWithKeyboard);
    viewport.addEventListener("scroll", syncWithKeyboard);

    return () => {
      window.cancelAnimationFrame(frameId);
      viewport.removeEventListener("resize", syncWithKeyboard);
      viewport.removeEventListener("scroll", syncWithKeyboard);
    };
  }, []);

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
    if (nextClientName.length < 3 || nextClientName.length > 50) {
      setValidationError("O nome do cliente deve ter entre 3 e 50 caracteres.");
      return;
    }
    if (nextServiceName.length > 100) {
      setValidationError("A descrição do serviço deve ter no máximo 100 caracteres.");
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
      ref={modalRef}
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
                minLength={3}
                maxLength={50}
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
                maxLength={100}
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
            <small className="character-limit" aria-live="polite">
              {serviceName.length}/100
            </small>
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
