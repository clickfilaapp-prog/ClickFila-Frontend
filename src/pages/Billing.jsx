import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Info,
  LoaderCircle,
  Pencil,
  Power,
  QrCode,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import CreditCardUpdateModal from "../components/billing/CreditCardUpdateModal";
import PixPaymentModal from "../components/billing/PixPaymentModal";
import ConfirmationModal from "../components/professionalDashboard/ConfirmationModal";
import {
  clearProfessionalDashboardCache,
  deactivateBusiness,
  getMyBusiness,
  getProfessionalDashboard,
  updateMyBusiness,
} from "../services/queue";
import {
  cancelSubscription,
  getMySubscription,
  getPlans,
  getSubscriptionPixQrCode,
  regularizeSubscription,
  updateSubscriptionPaymentMethod,
} from "../services/billing";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function firstValue(...values) {
  return (
    values.find(
      (value) => value !== undefined && value !== null && value !== "",
    ) ?? null
  );
}

function formatDate(value) {
  if (!value) return "Não informado";
  const date = new Date(
    String(value).includes("T") ? value : `${value}T12:00:00`,
  );
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("pt-BR");
}

function formatDocument(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11)
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digits.length === 14)
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  return value || "Não informado";
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10)
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  if (digits.length === 11)
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return value || "Não informado";
}

const STATUS_LABELS = {
  ACTIVE: "Assinatura ativa",
  TRIAL: "Em teste",
  PAST_DUE: "Pagamento pendente",
  PENDING: "Aguardando pagamento",
  SUSPENDED: "Suspensa",
  CANCELED: "Cancelada",
};

function daysUntil(value) {
  if (!value) return null;
  const end = new Date(
    String(value).includes("T") ? value : `${value}T23:59:59`,
  );
  if (Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
}

function billingDaysUntil(value) {
  if (!value) return null;
  const dueDate = new Date(
    String(value).includes("T") ? value : `${value}T00:00:00`,
  );
  if (Number.isNaN(dueDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return Math.round((dueDate.getTime() - today.getTime()) / 86400000);
}

function normalizePixData(response) {
  if (!response) return null;
  const pixQrCodeBase64 = response.pixQrCodeBase64 || response.encodedImage;
  const pixCopiaECola = response.pixCopiaECola || response.payload;
  return pixQrCodeBase64 && pixCopiaECola
    ? { ...response, pixQrCodeBase64, pixCopiaECola }
    : null;
}

function matchesCurrentPlan(plan, subscription) {
  const current = [
    subscription?.planCode,
    subscription?.planName,
    subscription?.plan?.code,
    subscription?.plan?.name,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return [plan?.code, plan?.name]
    .filter(Boolean)
    .some((value) => current.includes(String(value).toLowerCase()));
}

export default function Billing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [plansLoaded, setPlansLoaded] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [error, setError] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [updatingCard, setUpdatingCard] = useState(false);
  const [updatingRejectedCard, setUpdatingRejectedCard] = useState(false);
  const [regularizingSubscription, setRegularizingSubscription] =
    useState(false);
  const [regularizationInitialMethod, setRegularizationInitialMethod] =
    useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [pixData, setPixData] = useState(null);
  const [loadingPix, setLoadingPix] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const optional404 = (promise) =>
          promise.catch((requestError) => {
            if (requestError.status === 404) return null;
            throw requestError;
          });
        const optionalBusiness = getMyBusiness().catch(() => null);
        const navigationBusinessId = location.state?.businessId || null;
        const navigationRole = String(
          location.state?.businessRole || "",
        ).toUpperCase();
        const dashboardRequest =
          navigationBusinessId && navigationRole
            ? Promise.resolve({
                businessId: navigationBusinessId,
                loggedMemberRole: navigationRole,
              })
            : getProfessionalDashboard();
        const [dashboard, currentBusiness, currentSubscription] =
          await Promise.all([
            dashboardRequest,
            optionalBusiness,
            optional404(getMySubscription()),
          ]);
        if (!active) return;
        const role = String(dashboard?.loggedMemberRole || "").toUpperCase();
        if (role && role !== "OWNER") {
          navigate("/professionalDashboard", { replace: true });
          return;
        }
        const businessPayload =
          currentBusiness?.data ||
          currentBusiness?.business ||
          currentBusiness ||
          {};
        const loadedBusiness = {
          ...(dashboard?.business || {}),
          ...businessPayload,
          id: firstValue(
            businessPayload?.id,
            businessPayload?.businessId,
            dashboard?.businessId,
          ),
          name: firstValue(
            businessPayload?.name,
            businessPayload?.businessName,
            dashboard?.businessName,
          ),
        };
        setBusiness(loadedBusiness);
        setBusinessName(loadedBusiness.name || "");
        setSubscription(currentSubscription);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [navigate, location.state?.businessId, location.state?.businessRole]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const status = String(subscription?.status || "").toUpperCase();
  const businessId = business?.id;
  const currentPlan = plans.find((plan) =>
    matchesCurrentPlan(plan, subscription),
  );
  const planName = firstValue(
    subscription?.planName,
    subscription?.plan?.name,
    currentPlan?.name,
    "Sem plano",
  );
  const planPrice = Number(
    firstValue(
      subscription?.price,
      subscription?.amount,
      subscription?.planPrice,
      subscription?.plan?.price,
      currentPlan?.price,
      0,
    ),
  );
  const billingCycle = firstValue(
    subscription?.billingCycle,
    subscription?.plan?.billingCycle,
    currentPlan?.billingCycle,
  );
  const periodEnd = firstValue(
    subscription?.nextBillingDate,
    subscription?.currentPeriodEnd,
    subscription?.expiresAt,
  );
  const currentPlanCode = firstValue(
    subscription?.planCode,
    subscription?.planId,
    subscription?.plan?.code,
    subscription?.plan?.id,
    currentPlan?.code,
    currentPlan?.id,
  );
  const cancelAtPeriodEnd = Boolean(subscription?.cancelAtPeriodEnd);
  const canReactivateSubscription = status === "CANCELED" || cancelAtPeriodEnd;
  const displayedStatus = canReactivateSubscription ? "CANCELED" : status;
  const savedCreditCard = subscription?.creditCard || null;
  const paymentMethod = String(
    firstValue(
      subscription?.activePaymentMethod,
      subscription?.paymentMethod,
      subscription?.paymentType,
      subscription?.billingType,
      savedCreditCard ? "CREDIT_CARD" : "PIX",
    ),
  )
    .trim()
    .toUpperCase();
  const creditCard =
    paymentMethod === "CREDIT_CARD" && savedCreditCard
      ? {
          ...savedCreditCard,
          brand: savedCreditCard.cardBrand || savedCreditCard.brand,
        }
      : null;
  const hasPendingPayment = subscription?.hasPendingPayment === true;
  const trialDays = daysUntil(periodEnd);
  const remainingCanceledDays = billingDaysUntil(periodEnd);
  const pendingDays = billingDaysUntil(subscription?.currentPeriodEnd);
  const pendingPeriodEnd = subscription?.currentPeriodEnd;
  const activePaymentNeedsAttention =
    status === "ACTIVE" &&
    hasPendingPayment &&
    (paymentMethod === "PIX" ||
      (paymentMethod === "CREDIT_CARD" &&
        pendingDays !== null &&
        pendingDays < 0));
  const statusAlert = (() => {
    if (status === "SUSPENDED")
      return {
        className: "suspended",
        message:
          paymentMethod === "PIX"
            ? "Seu acesso está suspenso por falta de pagamento. Regularize agora via PIX para reativar o seu sistema imediatamente."
            : "Seu acesso está suspenso. Todas as tentativas de cobrança no cartão falharam. Atualize sua forma de pagamento para reativar o sistema.",
      };
    if (status === "PAST_DUE")
      return {
        className: "pending-payment overdue",
        message:
          paymentMethod === "PIX"
            ? `Sua fatura do dia ${formatDate(pendingPeriodEnd)} está vencida. Regularize o pagamento via PIX para não perder o acesso.`
            : "Sua fatura está vencida. Houve uma falha na cobrança automática do cartão. Atualize seus dados para regularizar.",
      };
    if (status === "CANCELED" || cancelAtPeriodEnd)
      return {
        className: "canceled",
        message:
          remainingCanceledDays !== null && remainingCanceledDays > 0
            ? `Sua assinatura está cancelada, mas você ainda tem acesso até ${formatDate(periodEnd)}.`
            : "Sua assinatura está cancelada.",
      };
    if (status === "TRIAL") {
      const remainingTrialDays =
        trialDays !== null
          ? `Faltam ${trialDays} ${trialDays === 1 ? "dia" : "dias"}`
          : "";
      return hasPendingPayment
        ? {
            className: "pending-payment",
            message: `Você tem um pagamento PIX pendente para ativar a sua assinatura.${
              remainingTrialDays ? ` (${remainingTrialDays} de teste)` : ""
            }`,
          }
        : {
            className: "trial",
            message: `Você está no período de testes. Aproveite!${
              remainingTrialDays ? ` ${remainingTrialDays}.` : ""
            }`,
          };
    }
    if (status === "ACTIVE" && hasPendingPayment) {
      if (paymentMethod === "PIX") {
        if (pendingDays === null)
          return {
            className: "pending-payment upcoming",
            message: "Sua fatura está aguardando pagamento.",
          };
        if (pendingDays > 0)
          return {
            className: "pending-payment upcoming",
            message: `Sua fatura vence em ${pendingDays} ${pendingDays === 1 ? "dia" : "dias"}.`,
          };
        if (pendingDays === 0)
          return {
            className: "pending-payment due-today",
            message: "Atenção: Sua fatura vence hoje.",
          };
        return {
          className: "pending-payment overdue",
          message:
            "Sua fatura está vencida. Regularize para evitar o bloqueio do sistema.",
        };
      }
      if (paymentMethod === "CREDIT_CARD" && pendingDays !== null && pendingDays < 0)
        return {
          className: "pending-payment overdue",
          message:
            "Sua fatura está vencida (Cartão recusado). Atualize sua forma de pagamento para evitar o bloqueio.",
        };
    }
    return null;
  })();

  useEffect(() => {
    const billingAction = location.state?.billingAction;
    if (loading || status !== "PENDING" || !billingAction) return;
    navigate(location.pathname, {
      replace: true,
      state: {
        businessRole: location.state?.businessRole,
        businessId: location.state?.businessId,
      },
    });
    if (billingAction === "view-pix" && paymentMethod === "PIX")
      showPendingPix();
    if (billingAction === "payment-method") setUpdatingCard(true);
  }, [
    loading,
    location.pathname,
    location.state?.billingAction,
    location.state?.businessId,
    location.state?.businessRole,
    navigate,
    paymentMethod,
    status,
  ]);

  function subscribe(plan) {
    if (!businessId)
      return setError("Crie ou reative sua empresa antes de assinar um plano.");
    navigate(`/billing/checkout/${encodeURIComponent(plan.code)}`, {
      state: {
        plan,
        changingPlan: status === "ACTIVE" && !cancelAtPeriodEnd,
        savedCard: savedCreditCard,
      },
    });
  }

  async function togglePlans() {
    if (showPlans) {
      setShowPlans(false);
      return;
    }
    setShowPlans(true);
    if (plansLoaded || loadingPlans) return;
    setLoadingPlans(true);
    setError("");
    try {
      const availablePlans = await getPlans();
      setPlans(Array.isArray(availablePlans) ? availablePlans : []);
      setPlansLoaded(true);
    } catch (requestError) {
      setShowPlans(false);
      setError(requestError.message);
    } finally {
      setLoadingPlans(false);
    }
  }

  async function saveBusinessName(event) {
    event.preventDefault();
    const name = businessName.trim();
    if (name.length < 3 || name.length > 50) {
      setError("O nome da empresa deve ter entre 3 e 50 caracteres.");
      return;
    }
    setSavingBusiness(true);
    setError("");
    try {
      const updated = await updateMyBusiness(name);
      const updatedName = firstValue(
        updated?.name,
        updated?.businessName,
        name,
      );
      setBusiness((current) => ({
        ...current,
        ...(updated || {}),
        name: updatedName,
      }));
      setBusinessName(updatedName);
      clearProfessionalDashboardCache();
      setEditingBusiness(false);
      window.dispatchEvent(
        new CustomEvent("barberflow:profile-updated", {
          detail: { businessName: updatedName },
        }),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingBusiness(false);
    }
  }

  async function confirmBusinessDeactivation() {
    setLoading(true);
    setError("");
    try {
      await deactivateBusiness();
      clearProfessionalDashboardCache();
      navigate("/professionalDashboard", {
        replace: true,
        state: { toast: "Empresa desativada com sucesso." },
      });
    } catch (requestError) {
      setConfirmDeactivate(false);
      setError(
        requestError.status === 409
          ? "Não é possível desativar a empresa enquanto houver uma fila aberta ou clientes aguardando."
          : requestError.message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function confirmSubscriptionCancellation() {
    setCancelingSubscription(true);
    setError("");
    try {
      await cancelSubscription(businessId);
      setSubscription((current) => ({ ...current, cancelAtPeriodEnd: true }));
      setConfirmCancel(false);
      setShowPlans(false);
      setSuccessMessage(
        "Assinatura cancelada. O valor pago não será estornado, mas seu " +
          "acesso continuará disponível até o fim do ciclo já pago.",
      );
    } catch (requestError) {
      setConfirmCancel(false);
      setError(requestError.message);
    } finally {
      setCancelingSubscription(false);
    }
  }

  async function showPendingPix() {
    if (loadingPix) return;
    setLoadingPix(true);
    setError("");
    try {
      const response = await getSubscriptionPixQrCode();
      const normalizedPix = normalizePixData(response);
      setPixData(
        normalizedPix ||
          response || { pixQrCodeBase64: null, pixCopiaECola: null },
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingPix(false);
    }
  }

  async function regularizeWithPix() {
    if (loadingPix) return;
    setLoadingPix(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await regularizeSubscription({ paymentMethod: "PIX" });
      const normalizedPix = normalizePixData(response);
      setPixData(
        normalizedPix ||
          response || { pixQrCodeBase64: null, pixCopiaECola: null },
      );
      setSuccessMessage(
        normalizedPix
          ? "Pagamento gerado! Escaneie o QR Code ou copie a chave para pagar."
          : "Solicitação enviada. Estamos gerando seu QR Code PIX.",
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingPix(false);
    }
  }

  return (
    <DashboardLayout tutorialReady={false}>
      <main className="billing-main">
        {pixData && (
          <PixPaymentModal pixData={pixData} onClose={() => setPixData(null)} />
        )}
        {confirmDeactivate && (
          <ConfirmationModal
            confirmation={{
              title: "Desativar minha empresa",
              message:
                "Sua empresa ficará inativa e não poderá receber novas pessoas na fila. Deseja continuar?",
              confirmLabel: "Sim, desativar empresa",
              danger: true,
            }}
            loading={loading}
            onBack={() => setConfirmDeactivate(false)}
            onConfirm={confirmBusinessDeactivation}
          />
        )}
        {confirmCancel && (
          <ConfirmationModal
            confirmation={{
              title: "Cancelar assinatura",
              message:
                "O valor pago não será estornado. Você continuará com acesso " +
                "até o final do ciclo já pago. Deseja continuar?",
              backLabel: "Voltar",
              confirmLabel: "Sim, cancelar assinatura",
              danger: true,
            }}
            loading={cancelingSubscription}
            onBack={() => setConfirmCancel(false)}
            onConfirm={confirmSubscriptionCancellation}
          />
        )}
        {updatingCard && (
          <CreditCardUpdateModal
            planId={currentPlanCode}
            savedCard={updatingRejectedCard ? null : savedCreditCard}
            initialPaymentMethod={
              status === "PENDING" ? "CREDIT_CARD" : paymentMethod
            }
            initialValues={{
              name: firstValue(business?.ownerName, business?.user?.name, ""),
              email: firstValue(business?.user?.login, business?.email, ""),
              cpfCnpj: firstValue(
                business?.cpfCnpj,
                business?.document,
                business?.taxId,
                "",
              ),
              phone: firstValue(business?.user?.phone, business?.phone, ""),
            }}
            onClose={() => {
              setUpdatingCard(false);
              setUpdatingRejectedCard(false);
            }}
            onSuccess={(updatedPaymentMethod, response) => {
              setUpdatingCard(false);
              setUpdatingRejectedCard(false);
              if (
                updatedPaymentMethod === "PIX" &&
                response?.pixQrCodeBase64 &&
                response?.pixCopiaECola
              )
                setPixData(response);
              setSuccessMessage(
                updatedPaymentMethod === "PIX"
                  ? "Forma de pagamento alterada para PIX!"
                  : "Cartão atualizado com sucesso!",
              );
              getMySubscription()
                .then(setSubscription)
                .catch(() => {});
            }}
            onInvalidSubscription={() => {
              setUpdatingCard(false);
              setUpdatingRejectedCard(false);
              setError(
                "Não foi possível localizar uma assinatura ativa para atualização.",
              );
            }}
          />
        )}
        {regularizingSubscription && (
          <CreditCardUpdateModal
            savedCard={
              ["PAST_DUE", "SUSPENDED"].includes(status)
                ? null
                : savedCreditCard
            }
            initialPaymentMethod={
              regularizationInitialMethod ||
              (savedCreditCard ? "CREDIT_CARD" : "PIX")
            }
            initialValues={{
              name: firstValue(business?.ownerName, business?.user?.name, ""),
              email: firstValue(business?.user?.login, business?.email, ""),
              cpfCnpj: firstValue(
                business?.cpfCnpj,
                business?.document,
                business?.taxId,
                "",
              ),
              phone: firstValue(business?.user?.phone, business?.phone, ""),
            }}
            title="Regularizar assinatura"
            description={`Como deseja pagar o valor pendente de ${money.format(planPrice)}?`}
            regularization
            onSubmitPayment={regularizeSubscription}
            onClose={() => {
              setRegularizingSubscription(false);
              setRegularizationInitialMethod(null);
            }}
            onSuccess={(selectedPaymentMethod, response) => {
              setRegularizingSubscription(false);
              setRegularizationInitialMethod(null);
              if (selectedPaymentMethod === "PIX") {
                const normalizedPix = normalizePixData(response);
                setPixData(
                  normalizedPix ||
                    response || { pixQrCodeBase64: null, pixCopiaECola: null },
                );
                setSuccessMessage(
                  normalizedPix
                    ? "Pagamento gerado! Escaneie o QR Code ou copie a chave para pagar."
                    : "Solicitação enviada. Estamos gerando seu QR Code PIX.",
                );
              } else {
                setSubscription((current) => ({
                  ...current,
                  status: "ACTIVE",
                  hasPendingPayment: false,
                }));
                clearProfessionalDashboardCache();
                setSuccessMessage("Acesso liberado!");
              }
            }}
            onInvalidSubscription={() => {
              setRegularizingSubscription(false);
              setRegularizationInitialMethod(null);
              setError(
                "Não foi possível localizar a assinatura para regularização.",
              );
            }}
          />
        )}
        <div className="panel-heading billing-page-heading">
          <div>
            <span className="step">MINHA CONTA</span>
            <h1>Empresa e Assinatura</h1>
            <p>
              Gerencie as informações da sua empresa e acompanhe sua assinatura.
            </p>
          </div>
        </div>
        {error && (
          <div className="login-auth-error" role="alert">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="toast" role="status" aria-live="polite">
            {successMessage}
          </div>
        )}

        <section className="business-details-card">
          <div className="business-card-heading">
            <div className="billing-card-icon business-icon">
              <Building2 />
            </div>
            <div>
              <h2>Informações da empresa</h2>
              <p>Dados cadastrais da sua empresa.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBusinessName(business?.name || "");
                setEditingBusiness((editing) => !editing);
              }}
            >
              <Pencil size={17} /> {editingBusiness ? "Cancelar" : "Editar"}
            </button>
          </div>
          {loading ? (
            <p className="billing-loading">Carregando dados da empresa...</p>
          ) : editingBusiness ? (
            <form className="business-edit-form" onSubmit={saveBusinessName}>
              <label htmlFor="billing-business-name">Nome da empresa</label>
              <div>
                <input
                  id="billing-business-name"
                  value={businessName}
                  minLength={3}
                  maxLength={50}
                  onChange={(event) => setBusinessName(event.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={savingBusiness}>
                  {savingBusiness ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          ) : (
            <div className="business-details-grid">
              <div>
                <span>Nome da empresa</span>
                <strong>{business?.name || "Não informado"}</strong>
              </div>
              {firstValue(
                business?.cpfCnpj,
                business?.document,
                business?.taxId,
              ) && (
                <div>
                  <span>CPF/CNPJ</span>
                  <strong>
                    {formatDocument(
                      firstValue(
                        business?.cpfCnpj,
                        business?.document,
                        business?.taxId,
                      ),
                    )}
                  </strong>
                </div>
              )}
              {firstValue(business?.user?.login, business?.email) && (
                <div>
                  <span>E-mail da empresa</span>
                  <strong>
                    {firstValue(business?.user?.login, business?.email)}
                  </strong>
                </div>
              )}
              {firstValue(business?.user?.phone, business?.phone) && (
                <div>
                  <span>Telefone</span>
                  <strong>
                    {formatPhone(
                      firstValue(business?.user?.phone, business?.phone),
                    )}
                  </strong>
                </div>
              )}
              {firstValue(
                business?.createdAt,
                business?.createdDate,
                business?.registrationDate,
              ) && (
                <div>
                  <span>Data de cadastro</span>
                  <strong>
                    {formatDate(
                      firstValue(
                        business?.createdAt,
                        business?.createdDate,
                        business?.registrationDate,
                      ),
                    )}
                  </strong>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="current-subscription-card">
          <div className="business-card-heading">
            <div className="billing-card-icon subscription-icon">
              <CreditCard />
            </div>
            <div>
              <h2>Assinatura atual</h2>
              <p>Confira seu plano e o status da sua assinatura.</p>
            </div>
            {displayedStatus && (
              <span
                className={`subscription-status-badge status-${displayedStatus.toLowerCase()}`}
              >
                <CheckCircle2 size={15} />{" "}
                {STATUS_LABELS[displayedStatus] || displayedStatus}
              </span>
            )}
          </div>
          {loading ? (
            <p className="billing-loading">Carregando assinatura...</p>
          ) : (
            <>
              {statusAlert && (
                <div
                  className={`subscription-state-alert ${statusAlert.className}`}
                  role="alert"
                >
                  {(status === "TRIAL" && !hasPendingPayment) ||
                  statusAlert.className.includes("upcoming") ? (
                    <Info />
                  ) : (
                    <AlertTriangle />
                  )}
                  <span>{statusAlert.message}</span>
                  {status === "ACTIVE" &&
                    hasPendingPayment &&
                    paymentMethod === "PIX" && (
                    <button
                      className="billing-primary"
                      type="button"
                      disabled={loadingPix}
                      onClick={showPendingPix}
                    >
                      {loadingPix ? (
                        <>
                          <LoaderCircle className="billing-spinner" size={17} />{" "}
                          Carregando...
                        </>
                      ) : (
                        <>
                          <QrCode size={17} /> Pagar Fatura / Ver PIX
                        </>
                      )}
                    </button>
                  )}
                  {status === "ACTIVE" &&
                    hasPendingPayment &&
                    paymentMethod === "CREDIT_CARD" &&
                    pendingDays !== null &&
                    pendingDays < 0 && (
                      <button
                        className="billing-primary"
                        type="button"
                        onClick={() => {
                          setError("");
                          setSuccessMessage("");
                          setUpdatingRejectedCard(true);
                          setUpdatingCard(true);
                        }}
                      >
                        <CreditCard size={17} /> Atualizar Cartão de Crédito
                      </button>
                    )}
                </div>
              )}

              <div className="current-subscription-row">
                <div className="current-plan-data">
                  <span>Plano atual</span>
                  <strong>{planName}</strong>
                  {planPrice > 0 && (
                    <b>
                      {money.format(planPrice)}{" "}
                      <small>
                        /{billingCycle === "YEARLY" ? "ano" : "mês"}
                      </small>
                    </b>
                  )}
                </div>
                {creditCard && (
                  <div className="saved-card">
                    <CreditCard size={22} />
                    <div>
                      <span>Cartão atual</span>
                      <strong>
                        {creditCard.brand || "Cartão"} final{" "}
                        {creditCard.lastFourDigits}
                      </strong>
                    </div>
                  </div>
                )}
                {!creditCard && status !== "TRIAL" && (
                  <div className="saved-card empty">
                    <CreditCard size={22} />
                    <div>
                      <span>Forma de pagamento</span>
                      <strong>
                        {paymentMethod === "PIX" ? "PIX" : "Não informado"}
                      </strong>
                    </div>
                  </div>
                )}
                {status === "ACTIVE" && !cancelAtPeriodEnd && (
                  <div className="next-charge">
                    <CalendarDays size={21} />
                    <div>
                      <span>
                        {activePaymentNeedsAttention
                          ? "Vencimento da fatura"
                          : "Próxima cobrança"}
                      </span>
                      <strong>{formatDate(periodEnd)}</strong>
                      {periodEnd && (
                        <small>
                          {activePaymentNeedsAttention
                            ? "Aguardando pagamento"
                            : "Em dia"}
                        </small>
                      )}
                    </div>
                  </div>
                )}
                {status === "PENDING" && pendingPeriodEnd && (
                  <div className="next-charge">
                    <CalendarDays size={21} />
                    <div>
                      <span>Vencimento</span>
                      <strong>{formatDate(pendingPeriodEnd)}</strong>
                      <small>Pagamento pendente</small>
                    </div>
                  </div>
                )}
                {status === "PAST_DUE" && pendingPeriodEnd && (
                  <div className="next-charge overdue-charge">
                    <CalendarDays size={21} />
                    <div>
                      <span>Vencimento da fatura</span>
                      <strong>{formatDate(pendingPeriodEnd)}</strong>
                      <small>Fatura vencida</small>
                    </div>
                  </div>
                )}
                {status === "SUSPENDED" && pendingPeriodEnd && (
                  <div className="next-charge overdue-charge">
                    <CalendarDays size={21} />
                    <div>
                      <span>Vencimento da cobrança</span>
                      <strong>{formatDate(pendingPeriodEnd)}</strong>
                      <small>Fatura vencida</small>
                    </div>
                  </div>
                )}
              </div>

              {status === "PAST_DUE" && (
                <>
                  {paymentMethod === "PIX" ? (
                    <button
                      className="billing-primary billing-resolve-button"
                      type="button"
                      disabled={loadingPix}
                      onClick={regularizeWithPix}
                    >
                      {loadingPix ? (
                        <>
                          <LoaderCircle className="billing-spinner" size={17} />{" "}
                          Gerando PIX...
                        </>
                      ) : (
                        <>
                          <QrCode size={17} /> Pagar Fatura PIX
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="billing-primary billing-resolve-button"
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMessage("");
                        setRegularizationInitialMethod("CREDIT_CARD");
                        setRegularizingSubscription(true);
                      }}
                    >
                      <CreditCard size={17} /> Atualizar Cartão de Crédito
                    </button>
                  )}
                  <div className="pending-subscription-actions">
                    <button
                      className="change-plan-button"
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMessage("");
                        setRegularizationInitialMethod(paymentMethod);
                        setRegularizingSubscription(true);
                      }}
                    >
                      <CreditCard size={17} /> Alterar forma de pagamento
                    </button>
                    {businessId && (
                      <button
                        className="cancel-subscription-link"
                        type="button"
                        onClick={() => setConfirmCancel(true)}
                      >
                        Cancelar assinatura
                      </button>
                    )}
                  </div>
                </>
              )}
              {status === "SUSPENDED" && (
                <>
                  {paymentMethod === "PIX" ? (
                    <button
                      className="billing-primary billing-resolve-button"
                      type="button"
                      disabled={loadingPix}
                      onClick={regularizeWithPix}
                    >
                      {loadingPix ? (
                        <>
                          <LoaderCircle className="billing-spinner" size={17} />{" "}
                          Gerando PIX...
                        </>
                      ) : (
                        <>
                          <QrCode size={17} /> Pagar Fatura PIX
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="billing-primary billing-resolve-button"
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMessage("");
                        setRegularizationInitialMethod("CREDIT_CARD");
                        setRegularizingSubscription(true);
                      }}
                    >
                      <CreditCard size={17} /> Atualizar Cartão de Crédito
                    </button>
                  )}
                  <div className="pending-subscription-actions">
                    <button
                      className="change-plan-button"
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMessage("");
                        setRegularizationInitialMethod(paymentMethod);
                        setRegularizingSubscription(true);
                      }}
                    >
                      <CreditCard size={17} /> Alterar forma de pagamento
                    </button>
                    {businessId && (
                      <button
                        className="cancel-subscription-link"
                        type="button"
                        onClick={() => setConfirmCancel(true)}
                      >
                        Cancelar assinatura
                      </button>
                    )}
                  </div>
                </>
              )}
              {status === "PENDING" && !canReactivateSubscription && (
                <>
                  {hasPendingPayment && paymentMethod === "PIX" && (
                    <button
                      className="billing-primary trial-subscribe-button"
                      type="button"
                      disabled={loadingPix}
                      onClick={showPendingPix}
                    >
                      {loadingPix ? (
                        <>
                          <LoaderCircle className="billing-spinner" size={17} />{" "}
                          Carregando PIX...
                        </>
                      ) : (
                        <>
                          <QrCode size={17} /> Pagar com PIX
                        </>
                      )}
                    </button>
                  )}
                  {hasPendingPayment && paymentMethod === "CREDIT_CARD" && (
                    <button
                      className="billing-primary trial-subscribe-button"
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMessage("");
                        setUpdatingRejectedCard(true);
                        setUpdatingCard(true);
                      }}
                    >
                      <CreditCard size={17} /> Atualizar Cartão de Crédito
                    </button>
                  )}
                  <div className="pending-subscription-actions">
                    <button
                      className="change-plan-button"
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMessage("");
                        setUpdatingRejectedCard(false);
                        setUpdatingCard(true);
                      }}
                    >
                      <CreditCard size={17} /> Alterar forma de pagamento
                    </button>
                    {businessId && (
                      <button
                        className="cancel-subscription-link"
                        type="button"
                        onClick={() => setConfirmCancel(true)}
                      >
                        Cancelar assinatura
                      </button>
                    )}
                  </div>
                </>
              )}
              {canReactivateSubscription && (
                <button
                  className="billing-primary trial-subscribe-button"
                  type="button"
                  disabled={loadingPlans}
                  onClick={togglePlans}
                >
                  {loadingPlans
                    ? "Carregando planos..."
                    : showPlans
                      ? "Ocultar planos"
                      : "Ativar novamente"}
                </button>
              )}
              {status === "ACTIVE" && !cancelAtPeriodEnd && (
                <div className="active-subscription-actions">
                  <button
                    className="change-plan-button"
                    type="button"
                    disabled={loadingPlans}
                    onClick={togglePlans}
                  >
                    <ArrowRightLeft size={17} />{" "}
                    {loadingPlans
                      ? "Carregando planos..."
                      : showPlans
                        ? "Ocultar planos"
                        : "Trocar de plano"}
                  </button>
                  {currentPlanCode && (
                    <button
                      className="change-plan-button"
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMessage("");
                        setUpdatingCard(true);
                      }}
                    >
                      <CreditCard size={17} /> Alterar forma de pagamento
                    </button>
                  )}
                  {businessId && (
                    <button
                      className="cancel-subscription-link"
                      type="button"
                      onClick={() => setConfirmCancel(true)}
                    >
                      Cancelar assinatura
                    </button>
                  )}
                </div>
              )}
              {status === "TRIAL" && (
                <button
                  className="billing-primary trial-subscribe-button"
                  type="button"
                  disabled={hasPendingPayment ? loadingPix : loadingPlans}
                  onClick={hasPendingPayment ? showPendingPix : togglePlans}
                >
                  {hasPendingPayment ? (
                    loadingPix ? (
                      <>
                        <LoaderCircle className="billing-spinner" size={17} />{" "}
                        Carregando PIX...
                      </>
                    ) : (
                      <>
                        <QrCode size={17} /> Concluir Assinatura
                      </>
                    )
                  ) : loadingPlans ? (
                    "Carregando planos..."
                  ) : showPlans ? (
                    "Ocultar planos"
                  ) : (
                    "Assinar Agora"
                  )}
                </button>
              )}
            </>
          )}

          {showPlans && !loadingPlans && (
            <div className="embedded-plans">
              <div className="plans-grid">
                {plans.map((plan) => (
                  <article
                    className={`plan-card${matchesCurrentPlan(plan, subscription) ? " current-plan" : ""}`}
                    key={plan.id || plan.code}
                  >
                    <div className="plan-card-labels">
                      <span className="step">
                        {plan.billingCycle === "YEARLY" ? "ANUAL" : "MENSAL"}
                      </span>
                      {matchesCurrentPlan(plan, subscription) && (
                        <span className="current-plan-badge">Plano atual</span>
                      )}
                    </div>
                    <h3>{plan.name}</h3>
                    <strong>{money.format(Number(plan.price || 0))}</strong>
                    <p>
                      <CalendarDays size={17} /> Cobrança{" "}
                      {plan.billingCycle === "YEARLY" ? "anual" : "mensal"}
                    </p>
                    <button
                      className="billing-primary"
                      type="button"
                      disabled={
                        !canReactivateSubscription &&
                        matchesCurrentPlan(plan, subscription)
                      }
                      onClick={() => subscribe(plan)}
                    >
                      {canReactivateSubscription &&
                      matchesCurrentPlan(plan, subscription)
                        ? "Reativar este plano"
                        : matchesCurrentPlan(plan, subscription)
                          ? "Seu plano atual"
                          : "Escolher plano"}
                    </button>
                  </article>
                ))}
                {!plans.length && (
                  <p>Nenhum plano está disponível no momento.</p>
                )}
              </div>
            </div>
          )}
        </section>

        {businessId && (
          <section className="billing-danger-zone">
            <div className="danger-icon">
              <Power size={21} />
            </div>
            <div>
              <h2>Desativar minha empresa</h2>
              <p>Sua empresa ficará inativa e não poderá receber filas.</p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => setConfirmDeactivate(true)}
            >
              Desativar
            </button>
          </section>
        )}
      </main>
    </DashboardLayout>
  );
}
