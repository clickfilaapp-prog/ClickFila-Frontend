import React from "react";

export default function CancellationModal({ onClose }) {
  return (
    <div
      className="cancellation-modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cancel-alert-title"
    >
      <div>
        <h2 id="cancel-alert-title">Esperamos atender você em breve</h2>
        <p>
          O tempo de espera da sua chamada terminou, mas esperamos receber você
          novamente em breve. Será um prazer atender você na próxima vez!
        </p>
        <button className="login-auth-submit" type="button" onClick={onClose}>
          Entendi
        </button>
      </div>
    </div>
  );
}
