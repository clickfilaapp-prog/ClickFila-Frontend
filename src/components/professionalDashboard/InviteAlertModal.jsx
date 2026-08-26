import React from "react";
import { Building2, Check, X } from "lucide-react";

export default function InviteAlertModal({
  invite,
  loading,
  onClose,
  onAccept,
  onDecline,
}) {
  if (!invite) return null;
  return (
    <div
      className="confirmation-modal invite-alert-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-alert-title"
    >
      <div>
        <button
          className="member-modal-close"
          type="button"
          disabled={loading}
          onClick={onClose}
          aria-label="Fechar aviso"
        >
          <X size={20} />
        </button>
        <div className="invite-alert-icon">
          <Building2 size={26} />
        </div>
        <span className="step">NOVO CONVITE</span>
        <h2 id="invite-alert-title">Você foi convidado!</h2>
        <p>
          <strong>{invite.businessName}</strong> quer você na equipe como{" "}
          {invite.role === "OWNER" ? "Master" : "profissional"}.
        </p>
        <div className="invite-alert-actions">
          <button
            className="team-decline"
            type="button"
            disabled={loading}
            onClick={() => onDecline(invite)}
          >
            <X size={16} /> Recusar
          </button>
          <button
            className="team-accept"
            type="button"
            disabled={loading}
            onClick={() => onAccept(invite)}
          >
            <Check size={16} /> Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
