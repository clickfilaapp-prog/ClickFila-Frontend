import React, { useEffect, useState } from "react";
import { AlertTriangle, ArrowRightLeft, Building2, CalendarDays, CheckCircle2, CreditCard, Info, LoaderCircle, Pencil, Power, QrCode } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import CreditCardUpdateModal from "../components/billing/CreditCardUpdateModal";
import PixPaymentModal from "../components/billing/PixPaymentModal";
import ConfirmationModal from "../components/professionalDashboard/ConfirmationModal";
import { clearProfessionalDashboardCache, deactivateBusiness, getMyBusiness, getProfessionalDashboard, updateMyBusiness } from "../services/queue";
import { cancelSubscription, createSubscriptionCheckout, getMySubscription, getPlans } from "../services/billing";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "") ?? null;
}

function formatDate(value) {
  if (!value) return "Não informado";
  const date = new Date(String(value).includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("pt-BR");
}

function formatDocument(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value || "Não informado";
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return value || "Não informado";
}

const STATUS_LABELS = {
  ACTIVE: "Assinatura ativa", TRIAL: "Em teste", PAST_DUE: "Pagamento pendente",
  PENDING: "Aguardando pagamento", SUSPENDED: "Suspensa", CANCELED: "Cancelada",
};

function daysUntil(value) {
  if (!value) return null;
  const end = new Date(String(value).includes("T") ? value : `${value}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
}

function matchesCurrentPlan(plan, subscription) {
  const current = [subscription?.planCode, subscription?.planName, subscription?.plan?.code, subscription?.plan?.name]
    .filter(Boolean).map((value) => String(value).toLowerCase());
  return [plan?.code, plan?.name].filter(Boolean)
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
  const [successMessage, setSuccessMessage] = useState("");
  const [pixData, setPixData] = useState(null);
  const [loadingPix, setLoadingPix] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const optional404 = (promise) => promise.catch((requestError) => {
          if (requestError.status === 404) return null;
          throw requestError;
        });
        const optionalBusiness = getMyBusiness().catch(() => null);
        const navigationBusinessId = location.state?.businessId || null;
        const navigationRole = String(location.state?.businessRole || "").toUpperCase();
        const dashboardRequest = navigationBusinessId && navigationRole
          ? Promise.resolve({ businessId: navigationBusinessId, loggedMemberRole: navigationRole })
          : getProfessionalDashboard();
        const [dashboard, currentBusiness, currentSubscription] = await Promise.all([
          dashboardRequest, optionalBusiness, optional404(getMySubscription()),
        ]);
        if (!active) return;
        const role = String(dashboard?.loggedMemberRole || "").toUpperCase();
        if (role && role !== "OWNER") {
          navigate("/professionalDashboard", { replace: true });
          return;
        }
        const businessPayload = currentBusiness?.data || currentBusiness?.business || currentBusiness || {};
        const loadedBusiness = {
          ...(dashboard?.business || {}), ...businessPayload,
          id: firstValue(businessPayload?.id, businessPayload?.businessId, dashboard?.businessId),
          name: firstValue(businessPayload?.name, businessPayload?.businessName, dashboard?.businessName),
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
    return () => { active = false; };
  }, [navigate, location.state?.businessId, location.state?.businessRole]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const status = String(subscription?.status || "").toUpperCase();
  const businessId = business?.id;
  const currentPlan = plans.find((plan) => matchesCurrentPlan(plan, subscription));
  const planName = firstValue(subscription?.planName, subscription?.plan?.name, currentPlan?.name, "Sem plano");
  const planPrice = Number(firstValue(subscription?.price, subscription?.amount, subscription?.planPrice, subscription?.plan?.price, currentPlan?.price, 0));
  const billingCycle = firstValue(subscription?.billingCycle, subscription?.plan?.billingCycle, currentPlan?.billingCycle);
  const periodEnd = firstValue(subscription?.nextBillingDate, subscription?.currentPeriodEnd, subscription?.expiresAt);
  const currentPlanCode = firstValue(subscription?.planCode, subscription?.plan?.code, currentPlan?.code);
  const cancelAtPeriodEnd = Boolean(subscription?.cancelAtPeriodEnd);
  const canReactivateSubscription = status === "CANCELED" || cancelAtPeriodEnd;
  const savedCreditCard = subscription?.creditCard || null;
  const paymentMethod = String(subscription?.paymentMethod || (savedCreditCard ? "CREDIT_CARD" : "PIX")).toUpperCase();
  const creditCard = paymentMethod === "CREDIT_CARD" ? savedCreditCard : null;
  const trialDays = daysUntil(periodEnd);

  function subscribe(plan) {
    if (!businessId) return setError("Crie ou reative sua empresa antes de assinar um plano.");
    navigate(`/billing/checkout/${encodeURIComponent(plan.code)}`, {
      state: { plan, changingPlan: status === "ACTIVE" && !cancelAtPeriodEnd },
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
      const updatedName = firstValue(updated?.name, updated?.businessName, name);
      setBusiness((current) => ({ ...current, ...(updated || {}), name: updatedName }));
      setBusinessName(updatedName);
      clearProfessionalDashboardCache();
      setEditingBusiness(false);
      window.dispatchEvent(new CustomEvent("barberflow:profile-updated", { detail: { businessName: updatedName } }));
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
      navigate("/professionalDashboard", { replace: true, state: { toast: "Empresa desativada com sucesso." } });
    } catch (requestError) {
      setConfirmDeactivate(false);
      setError(requestError.status === 409
        ? "Não é possível desativar a empresa enquanto houver uma fila aberta ou clientes aguardando."
        : requestError.message);
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
      setSuccessMessage("Assinatura cancelada. Seu acesso continuará disponível até o fim do período atual.");
    } catch (requestError) {
      setConfirmCancel(false);
      setError(requestError.message);
    } finally {
      setCancelingSubscription(false);
    }
  }

  async function showPendingPix() {
    if (!currentPlanCode || loadingPix) return;
    setLoadingPix(true);
    setError("");
    try {
      const response = await createSubscriptionCheckout({ planId: currentPlanCode, paymentMethod: "PIX", creditCard: null, creditCardHolderInfo: null });
      if (!response?.pixQrCodeBase64 || !response?.pixCopiaECola) throw new Error("A API não retornou os dados da cobrança PIX.");
      setPixData(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingPix(false);
    }
  }

  return (
    <DashboardLayout tutorialReady={false}>
      <main className="billing-main">
        {pixData && <PixPaymentModal pixData={pixData} onClose={() => setPixData(null)} />}
        {confirmDeactivate && (
          <ConfirmationModal
            confirmation={{ title: "Desativar minha empresa", message: "Sua empresa ficará inativa e não poderá receber novas pessoas na fila. Deseja continuar?", confirmLabel: "Sim, desativar empresa", danger: true }}
            loading={loading} onBack={() => setConfirmDeactivate(false)} onConfirm={confirmBusinessDeactivation}
          />
        )}
        {confirmCancel && (
          <ConfirmationModal
            confirmation={{ title: "Cancelar assinatura", message: "Seu plano atual será cancelado. Deseja continuar?", backLabel: "Voltar", confirmLabel: "Sim, cancelar assinatura", danger: true }}
            loading={cancelingSubscription}
            onBack={() => setConfirmCancel(false)}
            onConfirm={confirmSubscriptionCancellation}
          />
        )}
        {updatingCard && (
          <CreditCardUpdateModal
            planId={currentPlanCode}
            initialPaymentMethod={status === "PENDING" ? "CREDIT_CARD" : paymentMethod}
            initialValues={{
              name: firstValue(business?.ownerName, business?.user?.name, ""),
              email: firstValue(business?.user?.login, business?.email, ""),
              cpfCnpj: firstValue(business?.cpfCnpj, business?.document, business?.taxId, ""),
              phone: firstValue(business?.user?.phone, business?.phone, ""),
            }}
            onClose={() => setUpdatingCard(false)}
            onSuccess={(updatedPaymentMethod) => {
              setUpdatingCard(false);
              setSuccessMessage(updatedPaymentMethod === "PIX" ? "Forma de pagamento alterada para PIX!" : "Cartão atualizado com sucesso!");
              getMySubscription().then(setSubscription).catch(() => {});
            }}
            onInvalidSubscription={() => { setUpdatingCard(false); setError("Não foi possível localizar uma assinatura ativa para atualização."); }}
          />
        )}
        <div className="panel-heading billing-page-heading">
          <div><span className="step">MINHA CONTA</span><h1>Empresa e Assinatura</h1><p>Gerencie as informações da sua empresa e acompanhe sua assinatura.</p></div>
        </div>
        {error && <div className="login-auth-error" role="alert">{error}</div>}
        {successMessage && <div className="toast" role="status" aria-live="polite">{successMessage}</div>}

        <section className="business-details-card">
          <div className="business-card-heading">
            <div className="billing-card-icon business-icon"><Building2 /></div>
            <div><h2>Informações da empresa</h2><p>Dados cadastrais da sua empresa.</p></div>
            <button type="button" onClick={() => { setBusinessName(business?.name || ""); setEditingBusiness((editing) => !editing); }}><Pencil size={17} /> {editingBusiness ? "Cancelar" : "Editar"}</button>
          </div>
          {loading ? <p className="billing-loading">Carregando dados da empresa...</p> : (
            editingBusiness ? (
              <form className="business-edit-form" onSubmit={saveBusinessName}>
                <label htmlFor="billing-business-name">Nome da empresa</label>
                <div><input id="billing-business-name" value={businessName} minLength={3} maxLength={50} onChange={(event) => setBusinessName(event.target.value)} autoFocus /><button type="submit" disabled={savingBusiness}>{savingBusiness ? "Salvando..." : "Salvar"}</button></div>
              </form>
            ) : (
              <div className="business-details-grid">
                <div><span>Nome da empresa</span><strong>{business?.name || "Não informado"}</strong></div>
                {firstValue(business?.cpfCnpj, business?.document, business?.taxId) && <div><span>CPF/CNPJ</span><strong>{formatDocument(firstValue(business?.cpfCnpj, business?.document, business?.taxId))}</strong></div>}
                {firstValue(business?.user?.login, business?.email) && <div><span>E-mail da empresa</span><strong>{firstValue(business?.user?.login, business?.email)}</strong></div>}
                {firstValue(business?.user?.phone, business?.phone) && <div><span>Telefone</span><strong>{formatPhone(firstValue(business?.user?.phone, business?.phone))}</strong></div>}
                {firstValue(business?.createdAt, business?.createdDate, business?.registrationDate) && <div><span>Data de cadastro</span><strong>{formatDate(firstValue(business?.createdAt, business?.createdDate, business?.registrationDate))}</strong></div>}
              </div>
            )
          )}
        </section>

        <section className="current-subscription-card">
          <div className="business-card-heading">
            <div className="billing-card-icon subscription-icon"><CreditCard /></div>
            <div><h2>Assinatura atual</h2><p>Confira seu plano e o status da sua assinatura.</p></div>
            {status && <span className={`subscription-status-badge status-${status.toLowerCase()}`}><CheckCircle2 size={15} /> {STATUS_LABELS[status] || status}</span>}
          </div>
          {loading ? <p className="billing-loading">Carregando assinatura...</p> : <>
            {status === "SUSPENDED" && <div className="subscription-state-alert suspended" role="alert"><AlertTriangle /><span>Problemas com o pagamento da sua assinatura. Seu acesso está temporariamente suspenso.</span></div>}
            {cancelAtPeriodEnd && <div className="subscription-state-alert canceled" role="status"><AlertTriangle /><span>Sua assinatura está cancelada, mas você ainda tem acesso até {formatDate(periodEnd)}.</span></div>}
            {status === "TRIAL" && <div className="subscription-state-alert trial" role="status"><Info /><span>Você está no período de testes.{trialDays !== null && ` Expira em ${trialDays} ${trialDays === 1 ? "dia" : "dias"}.`}</span></div>}

            <div className="current-subscription-row">
              <div className="current-plan-data"><span>Plano atual</span><strong>{planName}</strong>{planPrice > 0 && <b>{money.format(planPrice)} <small>/{billingCycle === "YEARLY" ? "ano" : "mês"}</small></b>}</div>
              {creditCard && <div className="saved-card"><CreditCard size={22} /><div><span>Cartão atual</span><strong>{creditCard.brand || "Cartão"} final {creditCard.lastFourDigits}</strong></div></div>}
              {!creditCard && status !== "TRIAL" && <div className="saved-card empty"><CreditCard size={22} /><div><span>Forma de pagamento</span><strong>{paymentMethod === "PIX" ? "PIX" : "Não informado"}</strong></div></div>}
              {status === "ACTIVE" && !cancelAtPeriodEnd && <div className="next-charge"><CalendarDays size={21} /><div><span>Próxima cobrança</span><strong>{formatDate(periodEnd)}</strong>{periodEnd && <small>Renovação automática</small>}</div></div>}
            </div>

            {status === "SUSPENDED" && currentPlanCode && <button className="billing-primary billing-resolve-button" type="button" onClick={() => { setError(""); setSuccessMessage(""); setUpdatingCard(true); }}>Resolver pendência</button>}
            {status === "PENDING" && currentPlanCode && <div className="pending-subscription-actions">
              {paymentMethod === "PIX" ? <>
                <button className="billing-primary" type="button" disabled={loadingPix} onClick={showPendingPix}>{loadingPix ? <><LoaderCircle className="billing-spinner" size={17} /> Carregando PIX...</> : <><QrCode size={17} /> Visualizar QR Code</>}</button>
                <button className="change-plan-button" type="button" onClick={() => { setError(""); setSuccessMessage(""); setUpdatingCard(true); }}><CreditCard size={17} /> Pagar com Cartão de Crédito</button>
              </> : <button className="billing-primary" type="button" onClick={() => { setError(""); setSuccessMessage(""); setUpdatingCard(true); }}><CreditCard size={17} /> Alterar Cartão</button>}
              <button className="change-plan-button" type="button" disabled={loadingPlans} onClick={togglePlans}><ArrowRightLeft size={17} /> {loadingPlans ? "Carregando planos..." : showPlans ? "Ocultar planos" : "Escolher outro plano"}</button>
              {businessId && <button className="cancel-subscription-link" type="button" onClick={() => setConfirmCancel(true)}>Cancelar assinatura</button>}
            </div>}
            {canReactivateSubscription && <button className="billing-primary trial-subscribe-button" type="button" disabled={loadingPlans} onClick={togglePlans}>{loadingPlans ? "Carregando planos..." : showPlans ? "Ocultar planos" : "Ativar novamente"}</button>}
            {status === "ACTIVE" && !cancelAtPeriodEnd && <div className="active-subscription-actions">
              <button className="change-plan-button" type="button" disabled={loadingPlans} onClick={togglePlans}><ArrowRightLeft size={17} /> {loadingPlans ? "Carregando planos..." : showPlans ? "Ocultar planos" : "Trocar de plano"}</button>
              {currentPlanCode && <button className="change-plan-button" type="button" onClick={() => { setError(""); setSuccessMessage(""); setUpdatingCard(true); }}><CreditCard size={17} /> Alterar forma de pagamento</button>}
              {businessId && <button className="cancel-subscription-link" type="button" onClick={() => setConfirmCancel(true)}>Cancelar assinatura</button>}
            </div>}
            {status === "TRIAL" && <button className="billing-primary trial-subscribe-button" type="button" disabled={loadingPlans} onClick={togglePlans}>{loadingPlans ? "Carregando planos..." : showPlans ? "Ocultar planos" : "Escolher plano e assinar"}</button>}
          </>}

          {showPlans && !loadingPlans && <div className="embedded-plans"><div className="plans-grid">
            {plans.map((plan) => (
              <article className={`plan-card${matchesCurrentPlan(plan, subscription) ? " current-plan" : ""}`} key={plan.id || plan.code}>
                <div className="plan-card-labels"><span className="step">{plan.billingCycle === "YEARLY" ? "ANUAL" : "MENSAL"}</span>{matchesCurrentPlan(plan, subscription) && <span className="current-plan-badge">Plano atual</span>}</div>
                <h3>{plan.name}</h3><strong>{money.format(Number(plan.price || 0))}</strong>
                <p><CalendarDays size={17} /> Cobrança {plan.billingCycle === "YEARLY" ? "anual" : "mensal"}</p>
                <button className="billing-primary" type="button" disabled={!canReactivateSubscription && matchesCurrentPlan(plan, subscription)} onClick={() => subscribe(plan)}>
                  {canReactivateSubscription && matchesCurrentPlan(plan, subscription) ? "Reativar este plano" : matchesCurrentPlan(plan, subscription) ? "Seu plano atual" : "Escolher plano"}
                </button>
              </article>
            ))}
            {!plans.length && <p>Nenhum plano está disponível no momento.</p>}
          </div></div>}
        </section>

        {businessId && <section className="billing-danger-zone">
          <div className="danger-icon"><Power size={21} /></div>
          <div><h2>Desativar minha empresa</h2><p>Sua empresa ficará inativa e não poderá receber filas.</p></div>
          <button type="button" disabled={loading} onClick={() => setConfirmDeactivate(true)}>Desativar</button>
        </section>}
      </main>
    </DashboardLayout>
  );
}
