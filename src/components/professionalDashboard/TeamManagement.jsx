import React, { useState } from "react";
import { Mail, Trash2, UserPlus, UsersRound } from "lucide-react";

export default function TeamManagement({
  team,
  sentInvites,
  busyMemberIds,
  loading,
  onInvite,
  onQuickAdd,
  onRemove,
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  async function submitInvite(event) {
    event.preventDefault();
    const succeeded = await onInvite(email);
    if (succeeded) setEmail("");
  }

  async function submitQuickMember(event) {
    event.preventDefault();
    const succeeded = await onQuickAdd(name);
    if (succeeded) setName("");
  }

  return (
    <div className="team-management-layout">
      <section className="profile-card team-card team-roster-card">
        <div className="team-management-heading">
          <div>
            <span className="step">EQUIPE</span>
            <h2>Equipe ativa</h2>
          </div>
          <span className="team-count">
            <UsersRound size={15} /> {team.length} ativo
            {team.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="team-items team-roster-list">
          {team.map((member) => {
            const isBusy = busyMemberIds.has(String(member.id));
            return (
              <div className="team-item" key={member.id}>
                <span className="team-avatar">
                  {member.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
                <div>
                  <strong>{member.name}</strong>
                  <small>
                    {member.role === "OWNER" ? "Master" : "Profissional"}
                  </small>
                  {isBusy && (
                    <small className="busy-member-label">Em atendimento</small>
                  )}
                </div>
                {member.role !== "OWNER" && (
                  <button
                    className="remove-team-member"
                    type="button"
                    disabled={loading}
                    onClick={() => onRemove(member)}
                    aria-label={`Remover ${member.name}`}
                    title="Remover da equipe"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="profile-card team-card team-actions-card">
        <span className="step">GERENCIAR PROFISSIONAIS</span>
        <h2>Adicionar à equipe</h2>
        <div className="team-management-forms">
          <form onSubmit={submitInvite}>
            <div className="team-form-icon">
              <Mail size={20} />
            </div>
            <h3>Enviar convite</h3>
            <p>
              Convide um profissional para acessar o sistema pelo próprio
              celular.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="profissional@email.com"
              aria-label="E-mail do profissional"
            />
            <button type="submit" disabled={loading}>
              Enviar convite
            </button>
          </form>
          <form onSubmit={submitQuickMember}>
            <div className="team-form-icon">
              <UserPlus size={20} />
            </div>
            <h3>Cadastro rápido</h3>
            <p>
              Adicione um profissional instantaneamente para chamar clientes
              no Tablet/Quiosque. Ele não terá acesso pelo celular.
            </p>
            <input
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do profissional"
            />
            <button type="submit" disabled={loading}>
              Adicionar à equipe
            </button>
          </form>
        </div>
        {sentInvites.length > 0 && (
          <div className="sent-invites">
            <h3 className="team-section-title">
              Convites enviados / pendentes
            </h3>
            {sentInvites.map((invite) => (
              <div className="sent-invite-item" key={invite.id}>
                <Mail size={17} />
                <div>
                  <strong>{invite.email}</strong>
                  <small>Aguardando resposta</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
