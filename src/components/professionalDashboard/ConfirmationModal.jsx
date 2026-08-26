import React from "react";

export default function ConfirmationModal({
  confirmation,
  loading,
  onBack,
  onConfirm,
}) {
  return (
    <div
      className="confirmation-modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div>
        <div
          className={`confirmation-icon ${confirmation.danger ? "danger" : ""}`}
        >
          {confirmation.danger ? "!" : "?"}
        </div>
        <h2 id="confirmation-title">{confirmation.title}</h2>
        <p>{confirmation.message}</p>
        <div
          className={`confirmation-actions ${confirmation.hideConfirm ? "single-action" : ""}`}
        >
          <button
            type="button"
            className={
              confirmation.hideConfirm
                ? "confirmation-accept"
                : "confirmation-back"
            }
            disabled={loading}
            onClick={onBack}
          >
            {confirmation.backLabel || "Voltar"}
          </button>
          {!confirmation.hideConfirm && (
            <button
              type="button"
              className={`confirmation-accept ${confirmation.danger ? "danger" : ""}`}
              disabled={loading}
              onClick={onConfirm}
            >
              {confirmation.confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
