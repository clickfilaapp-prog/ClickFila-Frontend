import React from "react";
import { UsersRound } from "lucide-react";

export default function WaitingList({ waiting }) {
  return (
    <article className="management">
      <div className="management-top">
        <div>
          <span className="step">PRÓXIMOS</span>
          <h2>
            Minha fila <b>{waiting.length}</b>
          </h2>
        </div>
      </div>
      {waiting.length ? (
        waiting.map((entry, index) => (
          <div className="manage-item" key={entry.id}>
            <UsersRound size={20} />
            <div>
              <strong>
                {index + 1}. {entry.clientName}
              </strong>
              <small>
                <b>OBS:</b> {entry.serviceName}
              </small>
            </div>
          </div>
        ))
      ) : (
        <div className="empty">
          <UsersRound size={28} />
          <p>Nenhum cliente aguardando.</p>
        </div>
      )}
    </article>
  );
}
