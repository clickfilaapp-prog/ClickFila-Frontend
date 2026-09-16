import React from "react";
import { X } from "lucide-react";

export default function MemberSelectionModal({
  team,
  loading,
  onClose,
  onSelect,
}) {
  return (
    <div
      className="confirmation-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-selection-title"
    >
      <div>
        <button
          className="member-modal-close"
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
        <img className="app-symbol-icon" src="/favicon.png" alt="" width="32" height="32" />
        <h2 id="member-selection-title">Quem está chamando?</h2>
        <p>Selecione o profissional que atenderá o próximo cliente.</p>
        <div className="member-selection-list">
          {!team.length && (
            <p role="alert">
              Nenhum membro da equipe está disponível para chamar.
            </p>
          )}
          {team.map((member) => (
            <button
              key={member.id}
              type="button"
              disabled={loading}
              onClick={() => onSelect(member)}
            >
              <strong>{member.name}</strong>
              <span>{member.role === "OWNER" ? "Master" : "Funcionário"}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
