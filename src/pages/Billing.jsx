import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, CreditCard, XCircle } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import ConfirmationModal from "../components/professionalDashboard/ConfirmationModal";
import { getProfessionalDashboard } from "../services/queue";
import {
  cancelSubscription,
  createSubscriptionCheckout,
  getMySubscription,
  getPaymentUrl,
  getPlans,
} from "../services/billing";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function daysUntil(date) {
  if (!date) return null;
  const end = new Date(`${date}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
}

export default function Billing() {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [availablePlans, dashboard, currentSubscription] =
        await Promise.all([
          getPlans(),
          getProfessionalDashboard({ force: true }),
          getMySubscription().catch((requestError) => {
            if (requestError.status === 404) return null;
            throw requestError;
          }),
        ]);
      setPlans(Array.isArray(availablePlans) ? availablePlans : []);
      setBusinessId(dashboard?.businessId || null);
      setSubscription(currentSubscription);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const status = String(subscription?.status || "").toUpperCase();
  const remainingDays = useMemo(
    () => daysUntil(subscription?.currentPeriodEnd),
    [subscription?.currentPeriodEnd],
  );

  async function subscribe(planCode) {
    if (!businessId) {
      setError("Crie ou reative sua barbearia antes de assinar um plano.");
      return;
    }
    setBusyPlan(planCode);
    setError("");
    try {
      const checkout = await createSubscriptionCheckout(businessId, planCode);
      const checkoutUrl = getPaymentUrl(checkout);
      if (!checkoutUrl) throw new Error("A API não retornou o link de pagamento.");
      window.location.href = checkoutUrl;
    } catch (requestError) {
      setError(requestError.message);
      setBusyPlan("");
    }
  }

  function payNow() {
    const paymentUrl = getPaymentUrl(subscription);
    if (paymentUrl) window.location.href = paymentUrl;
    else setError("Não há um link de cobrança disponível. Escolha um plano abaixo.");
  }

  async function confirmCancellation() {
    setLoading(true);
    setError("");
    try {
      await cancelSubscription(businessId);
      setSubscription((current) => ({ ...current, status: "CANCELED" }));
      setConfirmCancel(false);
      setToast("Assinatura cancelada com sucesso.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout tutorialReady={false}>
      <main className="billing-main">
        {confirmCancel && (
          <ConfirmationModal
            confirmation={{
              title: "Cancelar assinatura",
              message: "Tem certeza? Seu acesso poderá ser bloqueado ao fim do período vigente.",
              confirmLabel: "Sim, cancelar assinatura",
              danger: true,
            }}
            loading={loading}
            onBack={() => setConfirmCancel(false)}
            onConfirm={confirmCancellation}
          />
        )}
        <div className="panel-heading">
          <div><span className="step">FINANCEIRO</span><h1>Minha assinatura</h1></div>
        </div>
        {error && <div className="login-auth-error" role="alert">{error}</div>}
        {toast && <div className="toast" role="status">{toast}</div>}

        {subscription && (
          <section className={`subscription-summary status-${status.toLowerCase()}`}>
            <div className="subscription-status-icon">
              {status === "ACTIVE" ? <CheckCircle2 /> : status === "CANCELED" ? <XCircle /> : <AlertTriangle />}
            </div>
            <div>
              <span className="step">STATUS {status}</span>
              <h2>
                {status === "ACTIVE" && "Sua assinatura está em dia"}
                {status === "TRIAL" && `Seu período de teste acaba em ${remainingDays ?? "—"} dias`}
                {status === "PAST_DUE" && "Sua fatura está atrasada"}
                {status === "SUSPENDED" && "Acesso suspenso"}
                {status === "CANCELED" && "Sua assinatura foi cancelada"}
              </h2>
              <p>
                {subscription.planName && `Plano: ${subscription.planName}. `}
                {subscription.currentPeriodEnd && `Ciclo atual até ${new Date(`${subscription.currentPeriodEnd}T12:00:00`).toLocaleDateString("pt-BR")}.`}
              </p>
            </div>
            {["PAST_DUE", "SUSPENDED"].includes(status) && (
              <button className="billing-primary" type="button" onClick={payNow}>Pagar agora</button>
            )}
          </section>
        )}

        <section className="plans-section">
          <div className="plans-heading"><CreditCard /><div><h2>Escolha seu plano</h2><p>Valores atualizados diretamente pela plataforma.</p></div></div>
          {loading ? <p>Carregando planos...</p> : (
            <div className="plans-grid">
              {plans.map((plan) => (
                <article className="plan-card" key={plan.id || plan.code}>
                  <span className="step">{plan.billingCycle === "YEARLY" ? "ANUAL" : "MENSAL"}</span>
                  <h3>{plan.name}</h3>
                  <strong>{money.format(Number(plan.price || 0))}</strong>
                  <p><CalendarDays size={17} /> Cobrança {plan.billingCycle === "YEARLY" ? "anual" : "mensal"}</p>
                  <button className="billing-primary" type="button" disabled={Boolean(busyPlan)} onClick={() => subscribe(plan.code)}>
                    {busyPlan === plan.code ? "Abrindo checkout..." : status === "CANCELED" ? "Reativar plano" : "Assinar"}
                  </button>
                </article>
              ))}
              {!plans.length && <p>Nenhum plano está disponível no momento.</p>}
            </div>
          )}
        </section>

        {["ACTIVE", "TRIAL", "PAST_DUE"].includes(status) && businessId && (
          <section className="billing-danger-zone">
            <div><h2>Cancelar assinatura</h2><p>Use esta opção somente se não quiser renovar seu plano.</p></div>
            <button type="button" disabled={loading} onClick={() => setConfirmCancel(true)}>Cancelar assinatura</button>
          </section>
        )}
      </main>
    </DashboardLayout>
  );
}
