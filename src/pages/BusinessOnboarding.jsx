import React, { useEffect, useState } from "react";
import { Building2, Smartphone, UsersRound, WandSparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  clearProfessionalDashboardCache,
  createBusiness,
  createQueueSession,
  getProfessionalDashboard,
  reactivateBusiness,
} from "../services/queue";
import { getMyTeamInvites } from "../services/team";
import { isValidCpfCnpj } from "../utils/documentValidation";

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
  const location = useLocation();
  const initialDashboard = location.state?.dashboard || null;
  const [name, setName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [business, setBusiness] = useState(initialDashboard);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [pendingInvites, setPendingInvites] = useState(() =>
    Array.isArray(initialDashboard?.pendingInvites)
      ? initialDashboard.pendingInvites
      : [],
  );
  const [inviteMessage, setInviteMessage] = useState("");
  const [checkingSetup, setCheckingSetup] = useState(!initialDashboard);

  useEffect(() => {
    if (initialDashboard) return undefined;
    let active = true;
    getProfessionalDashboard({ force: true })
      .then((dashboard) => {
        if (!active) return;
        if (dashboard?.businessIsActive === true) {
          navigate("/professionalDashboard", { replace: true });
          return;
        }
        setBusiness(dashboard);
        setPendingInvites(dashboard?.pendingInvites || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCheckingSetup(false);
      });
    return () => {
      active = false;
    };
  }, [initialDashboard, navigate]);

  useEffect(() => {
    let active = true;
    getMyTeamInvites()
      .then((invites) => {
        if (active) setPendingInvites(Array.isArray(invites) ? invites : []);
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
    if (pendingInvites.length > 0) {
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
    const documentDigits = cpfCnpj.replace(/\D/g, "");
    if (!isValidCpfCnpj(documentDigits)) {
      setDocumentError("CPF/CNPJ inválido");
      return;
    }
    setDocumentError("");
    if (![11, 14].includes(documentDigits.length)) {
      setError("Informe um CPF ou CNPJ válido.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createBusiness(name, cpfCnpj);
      await createQueueSession();
      clearProfessionalDashboardCache();
      navigate("/professionalDashboard", {
        replace: true,
        state: {
          message: "Sua empresa foi criada com sucesso!",
          setupCreated: true,
        },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReactivation() {
    setLoading(true);
    setError("");
    try {
      await reactivateBusiness();
      clearProfessionalDashboardCache();
      navigate("/professionalDashboard", {
        replace: true,
        state: { message: "Barbearia reativada com sucesso!" },
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
      pendingInviteCount={pendingInvites.length}
      pendingInvites={pendingInvites}
      onOpenInvites={handleOpenInvites}
      tutorialReady={false}
      emailVerified={business?.emailVerified}
      emailVerificationInline
      onEmailVerified={() =>
        getProfessionalDashboard({ force: true }).then(setBusiness)
      }
    >
      {inviteMessage && (
        <div className="toast" role="status" aria-live="polite">
          {inviteMessage}
        </div>
      )}
      <main className="business-onboarding">
        {!checkingSetup && business?.businessIsActive === false && (
          <section className="onboarding-reactivation onboarding-form">
            <div className="onboarding-form-heading">
              <div className="onboarding-form-icon">
                <Building2 size={26} />
              </div>
              <div>
                <span className="step">BEM-VINDO DE VOLTA</span>
                <h2>Deseja reativar a barbearia {business.businessName}?</h2>
              </div>
            </div>
            <p className="onboarding-form-description">
              Reative sua barbearia para voltar a gerenciar a fila e os
              atendimentos.
            </p>
            {error && (
              <div className="login-auth-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="login-auth-submit"
              type="button"
              disabled={loading}
              onClick={handleReactivation}
            >
              {loading ? "Reativando..." : "Reativar barbearia"}
            </button>
          </section>
        )}
        {!checkingSetup && business?.businessIsActive !== false && (
          <section className="onboarding-hero">
            <div className="onboarding-copy">
              <span className="step">COMECE SUA EMPRESA</span>
              <h1>Uma empresa mais organizada começa aqui.</h1>
              <p>
                Crie sua empresa em poucos segundos e transforme a experiência
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
                  <h2>Como se chama sua empresa?</h2>
                </div>
              </div>
              <p className="onboarding-form-description">
                Você poderá ajustar os dados da empresa mais tarde.
              </p>
              <div
                className={`onboarding-field${documentError ? " has-error" : ""}`}
              >
                <label htmlFor="onboarding-business-name">
                  Nome da empresa
                </label>
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
              <div className="onboarding-field">
                <label htmlFor="onboarding-business-document">
                  CPF ou CNPJ
                </label>
                <input
                  id="onboarding-business-document"
                  required
                  inputMode="numeric"
                  value={cpfCnpj}
                  onChange={(event) => {
                    setCpfCnpj(event.target.value);
                    setDocumentError("");
                    setError("");
                  }}
                  placeholder="Digite o CPF ou CNPJ"
                />
                {documentError && (
                  <small className="onboarding-field-error" role="alert">
                    {documentError}
                  </small>
                )}
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
                {loading ? "Criando sua empresa..." : "Criar minha empresa"}
              </button>
            </form>
          </section>
        )}
      </main>
    </DashboardLayout>
  );
}
