import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { clearProfessionalDashboardCache, getMyBusiness, getProfessionalDashboard } from "../services/queue";
import { createSubscriptionCheckout, getMySubscription, getPlans } from "../services/billing";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const EMPTY_FORM = { holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "", name: "", email: "", cpfCnpj: "", postalCode: "", addressNumber: "", addressComplement: "", phone: "", mobilePhone: "" };
const FIELDS = new Set(Object.keys(EMPTY_FORM));
const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== "") ?? "";
const digits = (value, limit) => String(value || "").replace(/\D/g, "").slice(0, limit);

function validate(values) {
  const errors = {};
  const required = { holderName: "Informe o nome impresso no cartão.", number: "Informe o número do cartão.", expiryMonth: "Informe o mês de validade.", expiryYear: "Informe o ano de validade.", ccv: "Informe o CVV.", name: "Informe o nome do titular.", email: "Informe o e-mail do titular.", cpfCnpj: "Informe o CPF ou CNPJ.", postalCode: "Informe o CEP.", addressNumber: "Informe o número do endereço.", phone: "Informe o telefone." };
  Object.entries(required).forEach(([field, message]) => { if (!String(values[field] || "").trim()) errors[field] = message; });
  if (values.number && !/^\d{13,19}$/.test(values.number)) errors.number = "Número do cartão inválido.";
  if (values.expiryMonth && (Number(values.expiryMonth) < 1 || Number(values.expiryMonth) > 12)) errors.expiryMonth = "Mês de validade inválido.";
  if (values.expiryYear && !/^\d{4}$/.test(values.expiryYear)) errors.expiryYear = "Use o ano com 4 dígitos.";
  if (values.ccv && !/^\d{3,4}$/.test(values.ccv)) errors.ccv = "O CVV deve ter 3 ou 4 dígitos.";
  if (values.email && values.email.length > 50) errors.email = "O e-mail deve ter no máximo 50 caracteres.";
  else if (values.email && !values.email.includes("@")) errors.email = "O e-mail deve conter @.";
  else if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "E-mail inválido.";
  if (values.cpfCnpj && ![11, 14].includes(values.cpfCnpj.length)) errors.cpfCnpj = "CPF ou CNPJ inválido.";
  if (values.postalCode && values.postalCode.length !== 8) errors.postalCode = "CEP inválido.";
  if (values.phone && ![10, 11].includes(values.phone.length)) errors.phone = "Telefone inválido.";
  if (values.mobilePhone && ![10, 11].includes(values.mobilePhone.length)) errors.mobilePhone = "Celular inválido.";
  return errors;
}

function responseErrors(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const errors = {};
  const add = (rawField, message) => { const field = String(rawField || "").split(".").pop(); if (FIELDS.has(field) && message) errors[field] = String(message); };
  Object.entries(data).forEach(([field, message]) => { if (typeof message === "string") add(field, message); });
  [data.errors, data.fieldErrors, data.validationErrors, data.violations].forEach((collection) => {
    if (Array.isArray(collection)) collection.forEach((item) => add(item?.field || item?.propertyPath, item?.message || item?.defaultMessage));
    else if (collection && typeof collection === "object") Object.entries(collection).forEach(([field, message]) => add(field, message));
  });
  return errors;
}

function Field({ label, name, values, errors, onChange, optional = false, ...props }) {
  const error = errors[name];
  return <label className={`checkout-field${error ? " has-error" : ""}`}><span>{label}{optional && <small> (opcional)</small>}</span><input name={name} value={values[name]} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `checkout-${name}-error` : undefined} {...props} />{error && <small id={`checkout-${name}-error`} className="checkout-field-error">{error}</small>}</label>;
}

export default function SubscriptionCheckout() {
  const { planId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const changingPlan = Boolean(location.state?.changingPlan);
  const [plan, setPlan] = useState(location.state?.plan || null);
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getProfessionalDashboard(), getMyBusiness().catch(() => null), plan ? Promise.resolve([]) : getPlans()])
      .then(([dashboard, businessResponse, plans]) => {
        if (!active) return;
        if (String(dashboard?.loggedMemberRole || "").toUpperCase() !== "OWNER") return navigate("/professionalDashboard", { replace: true });
        const selected = plan || plans.find((item) => String(item.code) === String(planId));
        if (!selected) { setError("O plano selecionado não foi encontrado."); return; }
        setPlan(selected);
        const business = businessResponse?.data || businessResponse?.business || businessResponse || {};
        setValues((current) => ({ ...current, name: firstValue(business?.ownerName, business?.user?.name), email: firstValue(business?.user?.login, business?.email), cpfCnpj: digits(firstValue(business?.cpfCnpj, business?.document, business?.taxId), 14), phone: digits(firstValue(business?.user?.phone, business?.phone), 11) }));
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate, planId]);

  function onChange(event) {
    const { name, value } = event.target;
    const limits = { number: 19, expiryMonth: 2, expiryYear: 4, ccv: 4, cpfCnpj: 14, postalCode: 8, phone: 11, mobilePhone: 11 };
    setValues((current) => ({ ...current, [name]: limits[name] ? digits(value, limits[name]) : value }));
    setErrors((current) => { if (!current[name]) return current; const next = { ...current }; delete next[name]; return next; });
  }

  async function submit(event) {
    event.preventDefault();
    const validation = validate(values);
    setErrors(validation); setError("");
    if (Object.keys(validation).length) return;
    setSubmitting(true);
    try {
      await createSubscriptionCheckout({ planId: plan.code, creditCard: { holderName: values.holderName.trim(), number: values.number, expiryMonth: values.expiryMonth.padStart(2, "0"), expiryYear: values.expiryYear, ccv: values.ccv }, creditCardHolderInfo: { name: values.name.trim(), email: values.email.trim(), cpfCnpj: values.cpfCnpj, postalCode: values.postalCode, addressNumber: values.addressNumber.trim(), ...(values.addressComplement.trim() && { addressComplement: values.addressComplement.trim() }), phone: values.phone, ...(values.mobilePhone && { mobilePhone: values.mobilePhone }) } });
      setValues((current) => ({ ...current, ccv: "" }));
      setSuccess(true);
      clearProfessionalDashboardCache();
      getMySubscription().catch(() => {});
    } catch (requestError) {
      setValues((current) => ({ ...current, ccv: "" }));
      if (requestError.code === "PAYMENT_REJECTED") setError(requestError.message);
      else {
        const fieldErrors = responseErrors(requestError.data);
        if (requestError.status === 400 && Object.keys(fieldErrors).length) { setErrors(fieldErrors); setError("Confira os campos destacados e tente novamente."); }
        else setError(requestError.message);
      }
    } finally { setSubmitting(false); }
  }

  return <DashboardLayout tutorialReady={false}><main className="checkout-page">
    <button className="checkout-back" type="button" onClick={() => navigate("/billing")}><ArrowLeft size={18} /> Voltar para assinatura</button>
    {loading ? <div className="checkout-page-card checkout-loading"><LoaderCircle className="billing-spinner" /> Carregando pagamento...</div> : success ? <section className="checkout-page-card checkout-success" role="status"><CheckCircle2 size={64} /><h1>{changingPlan ? "Plano alterado com sucesso" : "Assinatura ativada com sucesso"}</h1><p>{changingPlan ? "Seu novo plano já está ativo na assinatura." : "Seu pagamento foi aprovado e os recursos premium já estão liberados."}</p><button className="billing-primary" type="button" onClick={() => navigate("/professionalDashboard", { replace: true, state: { toast: changingPlan ? "Plano alterado com sucesso!" : "Assinatura ativada com sucesso!" } })}>Acessar recursos premium</button></section> : <section className="checkout-page-card">
      <div className="checkout-heading"><ShieldCheck /><div><span className="step">PAGAMENTO</span><h1>{changingPlan ? "Confirme a troca de plano" : "Finalize sua assinatura"}</h1><p>{plan?.name} {Number(plan?.price) > 0 && `• ${money.format(Number(plan.price))}`}</p></div></div>
      {error && <div className="login-auth-error" role="alert">{error}</div>}
      {plan && <form onSubmit={submit} noValidate><fieldset><legend><CreditCard size={18} /> Dados do cartão</legend><div className="checkout-form-grid"><Field label="Nome impresso no cartão" name="holderName" values={values} errors={errors} onChange={onChange} maxLength={50} autoComplete="cc-name" /><Field label="Número do cartão" name="number" values={values} errors={errors} onChange={onChange} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" /><Field label="Mês" name="expiryMonth" values={values} errors={errors} onChange={onChange} inputMode="numeric" autoComplete="cc-exp-month" placeholder="MM" /><Field label="Ano" name="expiryYear" values={values} errors={errors} onChange={onChange} inputMode="numeric" autoComplete="cc-exp-year" placeholder="AAAA" /><Field label="CVV" name="ccv" values={values} errors={errors} onChange={onChange} inputMode="numeric" autoComplete="cc-csc" placeholder="123" /></div></fieldset>
      <fieldset><legend>Dados do titular</legend><p className="checkout-section-note">Estas informações são obrigatórias para a análise antifraude.</p><div className="checkout-form-grid holder-grid"><Field label="Nome completo" name="name" values={values} errors={errors} onChange={onChange} maxLength={50} autoComplete="name" /><Field label="E-mail" name="email" values={values} errors={errors} onChange={onChange} type="email" maxLength={50} autoComplete="email" /><Field label="CPF/CNPJ" name="cpfCnpj" values={values} errors={errors} onChange={onChange} inputMode="numeric" /><Field label="CEP" name="postalCode" values={values} errors={errors} onChange={onChange} inputMode="numeric" autoComplete="postal-code" /><Field label="Número do endereço" name="addressNumber" values={values} errors={errors} onChange={onChange} maxLength={10} /><Field label="Complemento" name="addressComplement" values={values} errors={errors} onChange={onChange} maxLength={20} optional /><Field label="Telefone" name="phone" values={values} errors={errors} onChange={onChange} inputMode="tel" autoComplete="tel" /><Field label="Celular" name="mobilePhone" values={values} errors={errors} onChange={onChange} optional inputMode="tel" /></div></fieldset><button className="billing-primary checkout-submit" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="billing-spinner" size={18} /> Processando...</> : changingPlan ? "Confirmar troca de plano" : "Assinar"}</button></form>}
    </section>}
  </main></DashboardLayout>;
}
