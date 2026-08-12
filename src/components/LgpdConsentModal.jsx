import React, { useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole, ShieldCheck, X } from "lucide-react";

export default function LgpdConsentModal({
  isProfessional,
  isSubmitting,
  onClose,
  onConfirm,
}) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  return (
    <div
      className="lgpd-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lgpd-modal-title"
      aria-describedby="lgpd-modal-description"
    >
      <section>
        <button
          className="lgpd-modal-close"
          type="button"
          aria-label="Fechar termos de privacidade"
          disabled={isSubmitting}
          onClick={onClose}
        >
          <X size={19} />
        </button>

        <div className="lgpd-modal-heading">
          <span><ShieldCheck size={23} /></span>
          <div>
            <small>Privacidade e proteção de dados</small>
            <h2 id="lgpd-modal-title">Termo de consentimento LGPD</h2>
          </div>
        </div>

        <p id="lgpd-modal-description">
          Antes de criar seu cadastro, leia como seus dados serão utilizados de
          acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>

        <div className="lgpd-modal-content">
          <h3>Quais dados coletamos?</h3>
          <p>
            Nome, telefone, e-mail e senha de acesso
            {isProfessional ? ", além do nome do negócio" : ""}. A senha é
            utilizada somente para autenticar e proteger sua conta.
          </p>

          <h3>Por que coletamos esses dados?</h3>
          <ul>
            <li><CheckCircle2 size={15} />Criar e identificar sua conta.</li>
            <li><CheckCircle2 size={15} />Permitir o acesso e a recuperação segura da conta.</li>
            <li><CheckCircle2 size={15} />Viabilizar a comunicação e o funcionamento das filas.</li>
            {isProfessional && (
              <li><CheckCircle2 size={15} />Identificar o estabelecimento para os clientes.</li>
            )}
          </ul>

          <div className="lgpd-security-note">
            <LockKeyhole size={19} />
            <p>
              Seus dados devem ser usados apenas para as finalidades informadas,
              com medidas de segurança e acesso restrito. Você pode solicitar
              acesso, correção ou exclusão dos seus dados, respeitadas as
              obrigações legais de conservação.
            </p>
          </div>
        </div>

        <label className="lgpd-consent-check">
          <input
            type="checkbox"
            checked={accepted}
            disabled={isSubmitting}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>
            Li e concordo com o tratamento dos meus dados pessoais para as
            finalidades descritas neste termo.
          </span>
        </label>

        <div className="lgpd-modal-actions">
          <button type="button" disabled={isSubmitting} onClick={onClose}>
            Voltar
          </button>
          <button
            className="dark"
            type="button"
            disabled={!accepted || isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? "Criando cadastro..." : "Confirmar e criar cadastro"}
          </button>
        </div>
      </section>
    </div>
  );
}
