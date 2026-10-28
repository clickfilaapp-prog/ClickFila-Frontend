import React, { useEffect, useState } from "react";
import { Building2, CalendarDays, CheckCircle2, CreditCard, LoaderCircle, Pencil, Power, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import ConfirmationModal from "../components/professionalDashboard/ConfirmationModal";
import { clearProfessionalDashboardCache, deactivateBusiness, getMyBusiness, getProfessionalDashboard, updateMyBusiness } from "../services/queue";
import { cancelSubscription, createSubscriptionCheckout, getMySubscription, getPlans } from "../services/billing";

const EMPTY_CHECKOUT = {
  holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "",
  name: "", email: "", cpfCnpj: "", postalCode: "", addressNumber: "",
  addressComplement: "", phone: "", mobilePhone: "",
};

const CHECKOUT_FIELDS = new Set(Object.keys(EMPTY_CHECKOUT));

function onlyDigits(value, maxLength) {
  return String(value || "").replace(/\D/g, "").slice(0, maxLength);
}

function validateCheckout(values) {
  const errors = {};
  const required = {
    holderName: "Informe o nome impresso no cartão.", number: "Informe o número do cartão.",
    expiryMonth: "Informe o mês de validade.", expiryYear: "Informe o ano de validade.",
    ccv: "Informe o CVV.", name: "Informe o nome do titular.", email: "Informe o e-mail do titular.",
    cpfCnpj: "Informe o CPF ou CNPJ.", postalCode: "Informe o CEP.",
    addressNumber: "Informe o número do endereço.", phone: "Informe o telefone.",
  };
  Object.entries(required).forEach(([field, message]) => { if (!String(values[field] || "").trim()) errors[field] = message; });
  const cardNumber = onlyDigits(values.number, 19);
  if (cardNumber && (cardNumber.length < 13 || cardNumber.length > 19)) errors.number = "Número do cartão inválido.";
  const month = Number(values.expiryMonth);
  if (values.expiryMonth && (month < 1 || month > 12)) errors.expiryMonth = "Mês de validade inválido.";
  if (values.expiryYear && !/^\d{4}$/.test(values.expiryYear)) errors.expiryYear = "Use o ano com 4 dígitos.";
  if (values.ccv && !/^\d{3,4}$/.test(values.ccv)) errors.ccv = "O CVV deve ter 3 ou 4 dígitos.";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "E-mail inválido.";
  if (values.cpfCnpj && ![11, 14].includes(onlyDigits(values.cpfCnpj, 14).length)) errors.cpfCnpj = "CPF ou CNPJ inválido.";
  if (values.postalCode && onlyDigits(values.postalCode, 8).length !== 8) errors.postalCode = "CEP inválido.";
  if (values.phone && ![10, 11].includes(onlyDigits(values.phone, 11).length)) errors.phone = "Telefone inválido.";
  if (values.mobilePhone && ![10, 11].includes(onlyDigits(values.mobilePhone, 11).length)) errors.mobilePhone = "Celular inválido.";
  return errors;
}

function validationErrorsFromResponse(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const result = {};
  const add = (rawField, message) => {
    const field = String(rawField || "").split(".").pop();
    if (CHECKOUT_FIELDS.has(field) && message) result[field] = String(message);
  };
  Object.entries(data).forEach(([field, message]) => {
    if (typeof message === "string") add(field, message);
  });
  [data.errors, data.fieldErrors, data.validationErrors, data.violations].forEach((collection) => {
    if (Array.isArray(collection)) collection.forEach((item) => add(item?.field || item?.propertyPath, item?.message || item?.defaultMessage));
    else if (collection && typeof collection === "object") Object.entries(collection).forEach(([field, message]) => add(field, message));
  });
  return result;
}

function CheckoutField({ label, name, values, errors, onChange, optional = false, ...inputProps }) {
  const error = errors[name];
  return (
    <label className={`checkout-field${error ? " has-error" : ""}`}>
      <span>{label}{optional && <small> (opcional)</small>}</span>
      <input name={name} value={values[name]} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `checkout-${name}-error` : undefined} {...inputProps} />
      {error && <small id={`checkout-${name}-error`} className="checkout-field-error">{error}</small>}
    </label>
  );
}

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
  ACTIVE: "Ativa", TRIAL: "Em teste", PAST_DUE: "Pagamento pendente",
  SUSPENDED: "Suspensa", CANCELED: "Cancelada",
};

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
  const [busyPlan, setBusyPlan] = useState("");
  const [showPlans, setShowPlans] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [error, setError] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutValues, setCheckoutValues] = useState(EMPTY_CHECKOUT);
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

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
    function releaseCheckoutState() {
      setBusyPlan("");
    }

    // Ao voltar do checkout, o navegador pode restaurar esta página pelo
    // back-forward cache com o estado anterior ainda em memória.
    window.addEventListener("pageshow", releaseCheckoutState);
    return () => window.removeEventListener("pageshow", releaseCheckoutState);
  }, []);

  const status = String(subscription?.status || "").toUpperCase();
  const businessId = business?.id;
  const currentPlan = plans.find((plan) => matchesCurrentPlan(plan, subscription));
  const planName = firstValue(subscription?.planName, subscription?.plan?.name, currentPlan?.name, "Sem plano");
  const planPrice = Number(firstValue(subscription?.price, subscription?.amount, subscription?.planPrice, subscription?.plan?.price, currentPlan?.price, 0));
  const billingCycle = firstValue(subscription?.billingCycle, subscription?.plan?.billingCycle, currentPlan?.billingCycle);
  const periodEnd = firstValue(subscription?.nextBillingDate, subscription?.currentPeriodEnd, subscription?.expiresAt);

  function subscribe(plan) {
    if (!businessId) return setError("Crie ou reative seu negócio antes de assinar um plano.");
    setError("");
    setCheckoutError("");
    setCheckoutErrors({});
    setCheckoutSuccess(false);
    setCheckoutPlan(plan);
    setCheckoutValues((current) => ({
      ...current,
      name: current.name || firstValue(business?.ownerName, business?.user?.name, ""),
      email: current.email || firstValue(business?.user?.login, business?.email, ""),
      cpfCnpj: current.cpfCnpj || firstValue(business?.cpfCnpj, business?.document, business?.taxId, ""),
      phone: current.phone || firstValue(business?.user?.phone, business?.phone, ""),
    }));
  }

  function payNow() {
    const planCode = firstValue(subscription?.planCode, subscription?.plan?.code, currentPlan?.code);
    if (planCode) subscribe({ ...(currentPlan || subscription?.plan || {}), code: planCode, name: planName, price: planPrice, billingCycle });
    else setError("Não foi possível identificar o plano atual. Escolha um plano abaixo.");
  }

  function updateCheckoutField(event) {
    const { name, value } = event.target;
    const digitLimits = { number: 19, expiryMonth: 2, expiryYear: 4, ccv: 4, cpfCnpj: 14, postalCode: 8, phone: 11, mobilePhone: 11 };
    const nextValue = digitLimits[name] ? onlyDigits(value, digitLimits[name]) : value;
    setCheckoutValues((current) => ({ ...current, [name]: nextValue }));
    setCheckoutErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function submitCheckout(event) {
    event.preventDefault();
    const errors = validateCheckout(checkoutValues);
    setCheckoutErrors(errors);
    setCheckoutError("");
    if (Object.keys(errors).length) return;
    setBusyPlan(checkoutPlan.code);
    try {
      await createSubscriptionCheckout({
        planId: checkoutPlan.code,
        creditCard: {
          holderName: checkoutValues.holderName.trim(), number: checkoutValues.number,
          expiryMonth: checkoutValues.expiryMonth.padStart(2, "0"), expiryYear: checkoutValues.expiryYear,
          ccv: checkoutValues.ccv,
        },
        creditCardHolderInfo: {
          name: checkoutValues.name.trim(), email: checkoutValues.email.trim(), cpfCnpj: checkoutValues.cpfCnpj,
          postalCode: checkoutValues.postalCode, addressNumber: checkoutValues.addressNumber.trim(),
          ...(checkoutValues.addressComplement.trim() && { addressComplement: checkoutValues.addressComplement.trim() }),
          phone: checkoutValues.phone,
          ...(checkoutValues.mobilePhone && { mobilePhone: checkoutValues.mobilePhone }),
        },
      });
      setCheckoutSuccess(true);
      setCheckoutValues((current) => ({ ...current, ccv: "" }));
      setSubscription((current) => ({ ...current, status: "ACTIVE", planCode: checkoutPlan.code, planName: checkoutPlan.name, price: checkoutPlan.price, billingCycle: checkoutPlan.billingCycle }));
      clearProfessionalDashboardCache();
      getMySubscription().then(setSubscription).catch(() => {});
    } catch (requestError) {
      setCheckoutValues((current) => ({ ...current, ccv: "" }));
      if (requestError.code === "PAYMENT_REJECTED") {
        setCheckoutError(requestError.message);
        return;
      }
      const fieldErrors = validationErrorsFromResponse(requestError.data);
      if (requestError.status === 400 && Object.keys(fieldErrors).length) {
        setCheckoutErrors(fieldErrors);
        setCheckoutError("Confira os campos destacados e tente novamente.");
      } else setCheckoutError(requestError.message);
    } finally {
      setBusyPlan("");
    }
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
      navigate("/professionalDashboard", { replace: true, state: { toast: "Negócio desativado com sucesso." } });
    } catch (requestError) {
      setConfirmDeactivate(false);
      setError(requestError.status === 409
        ? "Não é possível desativar o negócio enquanto houver uma fila aberta ou clientes aguardando."
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
      setSubscription((current) => ({ ...current, status: "CANCELED" }));
      setConfirmCancel(false);
      setShowPlans(false);
    } catch (requestError) {
      setConfirmCancel(false);
      setError(requestError.message);
    } finally {
      setCancelingSubscription(false);
    }
  }

  return (
    <DashboardLayout tutorialReady={false}>
      <main className="billing-main">
        {confirmDeactivate && (
          <ConfirmationModal
            confirmation={{ title: "Desativar meu negócio", message: "Seu negócio ficará inativo e não poderá receber novas pessoas na fila. Deseja continuar?", confirmLabel: "Sim, desativar negócio", danger: true }}
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
        {checkoutPlan && (
          <div className="checkout-modal-backdrop" role="presentation">
            <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
              <button className="checkout-close" type="button" aria-label="Fechar pagamento" disabled={Boolean(busyPlan)} onClick={() => setCheckoutPlan(null)}><X /></button>
              {checkoutSuccess ? (
                <div className="checkout-success" role="status">
                  <CheckCircle2 size={64} />
                  <h2 id="checkout-title">Assinatura ativada com sucesso</h2>
                  <p>Seu pagamento foi aprovado e os recursos premium já estão liberados.</p>
                  <button className="billing-primary" type="button" onClick={() => { setCheckoutPlan(null); setShowPlans(false); }}>Continuar</button>
                </div>
              ) : (
                <form onSubmit={submitCheckout} noValidate>
                  <div className="checkout-heading"><ShieldCheck /><div><h2 id="checkout-title">Pagamento seguro</h2><p>{checkoutPlan.name} {Number(checkoutPlan.price) > 0 && `• ${money.format(Number(checkoutPlan.price))}`}</p></div></div>
                  {checkoutError && <div className="checkout-alert" role="alert">{checkoutError}</div>}
                  <fieldset>
                    <legend>Dados do cartão</legend>
                    <div className="checkout-form-grid">
                      <CheckoutField label="Nome impresso no cartão" name="holderName" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} autoComplete="cc-name" />
                      <CheckoutField label="Número do cartão" name="number" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" />
                      <CheckoutField label="Mês" name="expiryMonth" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} inputMode="numeric" autoComplete="cc-exp-month" placeholder="MM" />
                      <CheckoutField label="Ano" name="expiryYear" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} inputMode="numeric" autoComplete="cc-exp-year" placeholder="AAAA" />
                      <CheckoutField label="CVV" name="ccv" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} inputMode="numeric" autoComplete="cc-csc" placeholder="123" />
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>Dados do titular</legend>
                    <p className="checkout-section-note">Estas informações são obrigatórias para a análise antifraude.</p>
                    <div className="checkout-form-grid holder-grid">
                      <CheckoutField label="Nome completo" name="name" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} autoComplete="name" />
                      <CheckoutField label="E-mail" name="email" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} type="email" autoComplete="email" />
                      <CheckoutField label="CPF/CNPJ" name="cpfCnpj" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} inputMode="numeric" />
                      <CheckoutField label="CEP" name="postalCode" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} inputMode="numeric" autoComplete="postal-code" />
                      <CheckoutField label="Número do endereço" name="addressNumber" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} autoComplete="address-line2" />
                      <CheckoutField label="Complemento" name="addressComplement" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} optional autoComplete="address-line3" />
                      <CheckoutField label="Telefone" name="phone" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} inputMode="tel" autoComplete="tel" />
                      <CheckoutField label="Celular" name="mobilePhone" values={checkoutValues} errors={checkoutErrors} onChange={updateCheckoutField} optional inputMode="tel" />
                    </div>
                  </fieldset>
                  <button className="billing-primary checkout-submit" type="submit" disabled={Boolean(busyPlan)}>{busyPlan ? <><LoaderCircle className="billing-spinner" size={18} /> Processando pagamento...</> : "Pagar e ativar assinatura"}</button>
                </form>
              )}
            </section>
          </div>
        )}

        <div className="panel-heading billing-page-heading">
          <div><span className="step">MINHA CONTA</span><h1>Empresa e Assinatura</h1><p>Gerencie as informações da sua empresa e acompanhe sua assinatura.</p></div>
        </div>
        {error && <div className="login-auth-error" role="alert">{error}</div>}

        <section className="business-details-card">
          <div className="business-card-heading">
            <div className="billing-card-icon business-icon"><Building2 /></div>
            <div><h2>Informações da empresa</h2><p>Dados cadastrais da sua empresa.</p></div>
            <button type="button" onClick={() => { setBusinessName(business?.name || ""); setEditingBusiness((editing) => !editing); }}><Pencil size={17} /> {editingBusiness ? "Cancelar" : "Editar"}</button>
          </div>
          {loading ? <p className="billing-loading">Carregando dados do negócio...</p> : (
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
          {loading ? <p className="billing-loading">Carregando assinatura...</p> : (
            <div className="current-subscription-row">
              <div className="current-plan-data"><span>Plano atual</span><strong>{planName}</strong>{planPrice > 0 && <b>{money.format(planPrice)} <small>/{billingCycle === "YEARLY" ? "ano" : "mês"}</small></b>}</div>
              <div className="next-charge"><CalendarDays size={21} /><div><span>Próxima cobrança</span><strong>{formatDate(periodEnd)}</strong>{periodEnd && <small>Renovação automática</small>}</div></div>
              <button className="change-plan-button" type="button" disabled={loadingPlans} onClick={togglePlans}><RefreshCw size={17} /> {loadingPlans ? "Carregando planos..." : showPlans ? "Ocultar planos" : "Trocar de plano"}</button>
            </div>
          )}
          {["PAST_DUE", "SUSPENDED"].includes(status) && <button className="billing-primary billing-pay-now" type="button" onClick={payNow}>Pagar agora</button>}

          {showPlans && !loadingPlans && <div className="embedded-plans"><div className="plans-grid">
            {plans.map((plan) => (
              <article className={`plan-card${matchesCurrentPlan(plan, subscription) ? " current-plan" : ""}`} key={plan.id || plan.code}>
                <div className="plan-card-labels"><span className="step">{plan.billingCycle === "YEARLY" ? "ANUAL" : "MENSAL"}</span>{matchesCurrentPlan(plan, subscription) && <span className="current-plan-badge">Plano atual</span>}</div>
                <h3>{plan.name}</h3><strong>{money.format(Number(plan.price || 0))}</strong>
                <p><CalendarDays size={17} /> Cobrança {plan.billingCycle === "YEARLY" ? "anual" : "mensal"}</p>
                <button className="billing-primary" type="button" disabled={Boolean(busyPlan) || matchesCurrentPlan(plan, subscription)} onClick={() => subscribe(plan)}>
                  {matchesCurrentPlan(plan, subscription) ? "Seu plano atual" : "Escolher plano"}
                </button>
              </article>
            ))}
            {!plans.length && <p>Nenhum plano está disponível no momento.</p>}
          </div>
            {["ACTIVE", "TRIAL", "PAST_DUE"].includes(status) && businessId && (
              <div className="cancel-subscription-row"><div><strong>Não quer continuar com o plano atual?</strong><span>O cancelamento encerra a renovação da assinatura.</span></div><button type="button" disabled={cancelingSubscription} onClick={() => setConfirmCancel(true)}>Cancelar plano atual</button></div>
            )}
          </div>}
        </section>

        {businessId && <section className="billing-danger-zone">
          <div className="danger-icon"><Power size={21} /></div>
          <div><h2>Desativar meu negócio</h2><p>Seu negócio ficará inativo e não poderá receber filas.</p></div>
          <button type="button" disabled={loading} onClick={() => setConfirmDeactivate(true)}>Desativar</button>
        </section>}
      </main>
    </DashboardLayout>
  );
}
