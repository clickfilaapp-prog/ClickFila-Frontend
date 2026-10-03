import React, { useState } from "react";
import { ChevronDown, Mail, Trash2, UserPlus, UsersRound } from "lucide-react";

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
  const [inviteExpanded, setInviteExpanded] = useState(false);
  const [quickAddExpanded, setQuickAddExpanded] = useState(false);
  const [teamExpanded, setTeamExpanded] = useState(false);

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
      <section
        className={`profile-card team-card team-roster-card${team.length >= 4 ? " has-mobile-collapse" : ""}${teamExpanded ? " is-expanded" : ""}`}
      >
        <div className="team-management-heading">
          <div>
            <span className="step">EQUIPE</span>
            <h2>Equipe ativa</h2>
          </div>
          <span className="team-count team-count-static">
            <UsersRound size={15} /> {team.length} ativo
            {team.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="team-items team-roster-list" id="team-roster-list">
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
        {team.length >= 4 && (
          <button
            className="team-roster-more"
            type="button"
            aria-expanded={teamExpanded}
            aria-controls="team-roster-list"
            onClick={() => setTeamExpanded((expanded) => !expanded)}
          >
            {teamExpanded ? "Mostrar menos" : `Mostrar mais (${team.length - 3})`}
            <ChevronDown size={17} aria-hidden="true" />
          </button>
        )}
      </section>

      <section className="profile-card team-card team-actions-card">
        <span className="step">GERENCIAR PROFISSIONAIS</span>
        <h2>Adicionar à equipe</h2>
        <div className="team-management-forms">
          <form
            className={`team-invite-form${inviteExpanded ? " is-expanded" : ""}`}
            onSubmit={submitInvite}
          >
            <div className="team-form-icon">
              <Mail size={20} />
            </div>
            <h3 className="team-invite-desktop-title">Enviar convite</h3>
            <button
              className="team-invite-toggle"
              type="button"
              aria-expanded={inviteExpanded}
              aria-controls="team-invite-fields"
              onClick={() => setInviteExpanded((expanded) => !expanded)}
            >
              <span><Mail size={18} /> Enviar convite</span>
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            <div className="team-invite-fields" id="team-invite-fields">
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
              <button className="team-invite-submit" type="submit" disabled={loading}>
                Enviar convite
              </button>
            </div>
          </form>
          <form
            className={`team-quick-form${quickAddExpanded ? " is-expanded" : ""}`}
            onSubmit={submitQuickMember}
          >
            <div className="team-form-icon">
              <UserPlus size={20} />
            </div>
            <h3 className="team-quick-desktop-title">Cadastro rápido</h3>
            <button
              className="team-quick-toggle"
              type="button"
              aria-expanded={quickAddExpanded}
              aria-controls="team-quick-fields"
              onClick={() => setQuickAddExpanded((expanded) => !expanded)}
            >
              <span><UserPlus size={18} /> Cadastro rápido</span>
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            <div className="team-quick-fields" id="team-quick-fields">
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
              <button className="team-add-submit" type="submit" disabled={loading}>
                Adicionar à equipe
              </button>
            </div>
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
