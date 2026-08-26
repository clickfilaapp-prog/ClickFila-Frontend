import React from "react";
import { Building2, Check, X } from "lucide-react";

function formatExpiration(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function PendingInvites({
  invites,
  loading,
  onAccept,
  onDecline,
}) {
  if (!invites?.length) return null;
  return (
    <section className="profile-card team-card pending-invites-card">
      <div className="pending-invites-heading">
        <div>
          <span className="step">CONVITES PENDENTES</span>
          <h2>Meus Convites Pendentes</h2>
        </div>
        <strong className="pending-invites-count">
          {invites.length} convite{invites.length === 1 ? "" : "s"}
        </strong>
      </div>
      <div className="team-items">
        {invites.map((invite) => (
          <article className="team-item" key={invite.id}>
            <Building2 size={22} />
            <div>
              <strong>{invite.businessName}</strong>
              <small>
                Função: {invite.role === "OWNER" ? "Master" : "Profissional"}
              </small>
              {invite.expiresAt && (
                <small>Expira em {formatExpiration(invite.expiresAt)}</small>
              )}
            </div>
            <div className="team-item-actions">
              <button
                className="team-accept"
                type="button"
                disabled={loading}
                onClick={() => onAccept(invite)}
              >
                <Check size={16} /> Aceitar
              </button>
              <button
                className="team-decline"
                type="button"
                disabled={loading}
                onClick={() => onDecline(invite)}
              >
                <X size={16} /> Recusar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
