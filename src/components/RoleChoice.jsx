import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  UserRound,
} from "lucide-react";

export default function RoleChoice({ onClient, onProfessional, onBack }) {
  return (
    <div className="role-choice auth-form-transition">
      {/* Cada opção apenas muda a etapa; os dados são coletados no formulário seguinte. */}
      <button type="button" onClick={onClient}>
        <span className="role-choice-icon">
          <UserRound size={24} />
        </span>
        <span>
          <strong>Quero ser cliente</strong>
          <small>Use tokens e acompanhe sua posição na fila.</small>
        </span>
        <ArrowRight size={19} />
      </button>
      <button type="button" onClick={onProfessional}>
        <span className="role-choice-icon">
          <BriefcaseBusiness size={24} />
        </span>
        <span>
          <strong>Sou profissional</strong>
          <small>Tenha seu token diário e sua própria fila.</small>
        </span>
        <ArrowRight size={19} />
      </button>
      <button className="back-to-login" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar para o login
      </button>
    </div>
  );
}
