import React, { useEffect, useState } from "react";
import { Building2, Smartphone, UsersRound, WandSparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  createBusiness,
  createQueueSession,
  getProfessionalDashboard,
} from "../services/queue";

const BENEFITS = [
  [
    WandSparkles,
    "Sala de espera organizada",
    "Acabe com a bagunça e organize cada atendimento em uma fila simples.",
  ],
  [
    Smartphone,
    "Cliente informado",
    "Seus clientes acompanham a posição e o chamado pelo próprio celular.",
  ],
  [
    UsersRound,
    "Equipe sob controle",
    "Cadastre profissionais e saiba quem está atendendo cada cliente.",
  ],
];

export default function BusinessOnboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingInviteCount, setPendingInviteCount] = useState(0);
  const [inviteMessage, setInviteMessage] = useState("");

  useEffect(() => {
    let active = true;
    getProfessionalDashboard()
      .then((dashboard) => {
        if (active) {
          setPendingInviteCount(dashboard?.pendingInvites?.length || 0);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!inviteMessage) return undefined;
    const timer = window.setTimeout(() => setInviteMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [inviteMessage]);

  function handleOpenInvites() {
    if (pendingInviteCount > 0) {
      navigate("/professionalDashboard", { replace: true });
      return;
    }
    setInviteMessage("Você não possui convites pendentes.");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createBusiness(name);
      await createQueueSession();
      navigate("/professionalDashboard", {
        replace: true,
        state: { message: "Seu negócio foi criado com sucesso!" },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout
      showInvites
      pendingInviteCount={pendingInviteCount}
      onOpenInvites={handleOpenInvites}
      tutorialReady={false}
    >
      {inviteMessage && (
        <div className="toast" role="status" aria-live="polite">
          {inviteMessage}
        </div>
      )}
      <main className="business-onboarding">
        <section className="onboarding-hero">
          <div className="onboarding-copy">
            <span className="step">COMECE SEU NEGÓCIO</span>
            <h1>Um negócio mais organizado começa aqui.</h1>
            <p>
              Crie seu negócio em poucos segundos e transforme a experiência
              da sua equipe e dos seus clientes.
            </p>
            <div className="onboarding-benefits">
              {BENEFITS.map(([Icon, title, description]) => (
                <article key={title}>
                  <Icon size={23} />
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <form className="onboarding-form" onSubmit={handleSubmit}>
            <div className="onboarding-form-heading">
              <div className="onboarding-form-icon">
                <Building2 size={26} />
              </div>
              <div>
                <span className="step">ÚLTIMO PASSO</span>
                <h2>Como se chama seu negócio?</h2>
              </div>
            </div>
            <p className="onboarding-form-description">
              Você poderá ajustar os dados do negócio mais tarde.
            </p>
            <div className="onboarding-field">
              <label htmlFor="onboarding-business-name">Nome do negócio</label>
              <input
                id="onboarding-business-name"
                autoFocus
                required
                minLength={2}
                maxLength={150}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="Ex.: Studio Essência"
              />
            </div>
            {error && (
              <div className="login-auth-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="login-auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Criando seu negócio..." : "Criar meu negócio"}
            </button>
          </form>
        </section>
      </main>
    </DashboardLayout>
  );
}
