import React from "react";
import { BellRing } from "lucide-react";

export default function NotificationConsentModal({
  isSubmitting,
  onAllow,
  onSkip,
}) {
  return (
    <div
      className="notification-consent-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-consent-title"
      aria-describedby="notification-consent-description"
    >
      <section>
        <span className="notification-consent-icon" aria-hidden="true">
          <BellRing size={27} />
        </span>
        <h2 id="notification-consent-title">Acompanhe sua vez</h2>
        <p id="notification-consent-description">
          Para receber avisos quando sua posição mudar ou quando chegar a sua
          vez, continue e depois escolha “Permitir” na janela de notificações
          do navegador. Sem essa autorização, o acompanhamento funcionará
          apenas enquanto esta tela estiver aberta.
        </p>
        <div className="notification-consent-actions">
          <button type="button" disabled={isSubmitting} onClick={onSkip}>
            Agora não
          </button>
          <button
            className="login-auth-submit"
            type="button"
            disabled={isSubmitting}
            onClick={onAllow}
          >
            {isSubmitting ? "Aguarde..." : "Continuar e habilitar"}
          </button>
        </div>
      </section>
    </div>
  );
}
