import React from "react";
import { createPortal } from "react-dom";

export default function ConfirmationModal({
  confirmation,
  loading,
  onBack,
  onConfirm,
}) {
  return createPortal(
    <div
      className={`confirmation-modal ${confirmation.danger ? "danger" : ""}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={confirmation.title ? "confirmation-title" : undefined}
      aria-label={confirmation.title ? undefined : "Confirmação"}
    >
      <div>
        <div
          className={`confirmation-icon ${confirmation.danger || confirmation.redIcon ? "danger" : ""}`}
        >
          {confirmation.danger ? "!" : "?"}
        </div>
        {confirmation.title && (
          <h2 id="confirmation-title">{confirmation.title}</h2>
        )}
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
              className={`confirmation-accept ${confirmation.danger ? "danger" : ""} ${confirmation.success ? "success" : ""}`}
              disabled={loading}
              onClick={onConfirm}
            >
              {confirmation.confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
