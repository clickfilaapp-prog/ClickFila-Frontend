import React, { useState } from "react";
import { CreditCard, LoaderCircle, QrCode, ShieldCheck, X } from "lucide-react";
import { updateSubscriptionPaymentMethod } from "../../services/billing";

const EMPTY = { holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "", name: "", email: "", cpfCnpj: "", postalCode: "", addressNumber: "", addressComplement: "", phone: "", mobilePhone: "" };
const digits = (value, limit) => String(value || "").replace(/\D/g, "").slice(0, limit);

function validate(values) {
  const errors = {};
  const required = { holderName: "Informe o nome impresso no cartão.", number: "Informe o número do cartão.", expiryMonth: "Informe o mês de validade.", expiryYear: "Informe o ano de validade.", ccv: "Informe o CVV.", name: "Informe o nome do titular.", email: "Informe o e-mail do titular.", cpfCnpj: "Informe o CPF ou CNPJ.", postalCode: "Informe o CEP.", addressNumber: "Informe o número do endereço.", phone: "Informe o telefone." };
  Object.entries(required).forEach(([field, message]) => { if (!String(values[field] || "").trim()) errors[field] = message; });
  if (values.number && !/^\d{13,19}$/.test(values.number)) errors.number = "Número do cartão inválido.";
  if (values.expiryMonth && (Number(values.expiryMonth) < 1 || Number(values.expiryMonth) > 12)) errors.expiryMonth = "Mês inválido.";
  if (values.expiryYear && !/^\d{4}$/.test(values.expiryYear)) errors.expiryYear = "Use o ano com 4 dígitos.";
  if (values.ccv && !/^\d{3,4}$/.test(values.ccv)) errors.ccv = "CVV inválido.";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "E-mail inválido.";
  if (values.cpfCnpj && ![11, 14].includes(values.cpfCnpj.length)) errors.cpfCnpj = "CPF ou CNPJ inválido.";
  if (values.postalCode && values.postalCode.length !== 8) errors.postalCode = "CEP inválido.";
  if (values.phone && ![10, 11].includes(values.phone.length)) errors.phone = "Telefone inválido.";
  return errors;
}

function Field({ label, name, values, errors, onChange, optional, inputMode, ...props }) {
  const error = errors[name];
  return <label className={`checkout-field${error ? " has-error" : ""}`}><span>{label}{optional && <small> (opcional)</small>}</span><input name={name} value={values[name]} onChange={onChange} inputMode={inputMode || (name === "addressNumber" ? "numeric" : undefined)} aria-invalid={Boolean(error)} {...props} />{error && <small className="checkout-field-error">{error}</small>}</label>;
}

export default function CreditCardUpdateModal({ planId, initialValues = {}, initialPaymentMethod = "CREDIT_CARD", onClose, onSuccess, onInvalidSubscription }) {
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod === "PIX" ? "PIX" : "CREDIT_CARD");
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initialValues, cpfCnpj: digits(initialValues.cpfCnpj, 14), phone: digits(initialValues.phone, 11) }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function choose(method) { setPaymentMethod(method); setErrors({}); setError(""); }
  function onChange({ target: { name, value } }) {
    const limits = { number: 19, expiryMonth: 2, expiryYear: 4, ccv: 4, cpfCnpj: 14, postalCode: 8, addressNumber: 10, phone: 11, mobilePhone: 11 };
    setValues((current) => ({ ...current, [name]: limits[name] ? digits(value, limits[name]) : value }));
    setErrors((current) => { const next = { ...current }; delete next[name]; return next; });
  }

  async function submit(event) {
    event.preventDefault();
    const validation = paymentMethod === "CREDIT_CARD" ? validate(values) : {};
    setErrors(validation); setError("");
    if (Object.keys(validation).length) return;
    setSubmitting(true);
    try {
      const cardPayload = paymentMethod === "CREDIT_CARD" ? {
        creditCard: { holderName: values.holderName.trim(), number: values.number, expiryMonth: values.expiryMonth.padStart(2, "0"), expiryYear: values.expiryYear, ccv: values.ccv },
        creditCardHolderInfo: { name: values.name.trim(), email: values.email.trim(), cpfCnpj: values.cpfCnpj, postalCode: values.postalCode, addressNumber: values.addressNumber.trim(), ...(values.addressComplement.trim() && { addressComplement: values.addressComplement.trim() }), phone: values.phone, ...(values.mobilePhone && { mobilePhone: values.mobilePhone }) },
      } : { creditCard: null, creditCardHolderInfo: null };
      await updateSubscriptionPaymentMethod({ planId, paymentMethod, ...cardPayload });
      onSuccess(paymentMethod);
    } catch (requestError) {
      setValues((current) => ({ ...current, ccv: "" }));
      if (["INVALID_SUBSCRIPTION", "SUBSCRIPTION_NOT_FOUND"].includes(requestError.code) || requestError.status === 404) return onInvalidSubscription();
      if (![400, 422].includes(requestError.status)) setError(requestError.message);
    } finally { setSubmitting(false); }
  }

  return <div className="checkout-modal-backdrop" role="presentation"><section className="checkout-modal card-update-modal" role="dialog" aria-modal="true" aria-labelledby="payment-update-title"><button className="checkout-close" type="button" aria-label="Fechar" disabled={submitting} onClick={onClose}><X /></button><div className="checkout-heading"><ShieldCheck /><div><h2 id="payment-update-title">Atualizar forma de pagamento</h2><p>Escolha como deseja pagar as próximas faturas.</p></div></div>{error && <div className="checkout-alert" role="alert">{error}</div>}<form onSubmit={submit} noValidate><fieldset><legend>Forma de pagamento</legend><div className="card-choice-list payment-method-list"><label className={`card-choice${paymentMethod === "CREDIT_CARD" ? " selected" : ""}`}><input type="radio" name="paymentMethod" checked={paymentMethod === "CREDIT_CARD"} onChange={() => choose("CREDIT_CARD")} /><CreditCard size={22} /><span><strong>Cartão de crédito</strong><small>Cadastrar um novo cartão</small></span></label><label className={`card-choice${paymentMethod === "PIX" ? " selected" : ""}`}><input type="radio" name="paymentMethod" checked={paymentMethod === "PIX"} onChange={() => choose("PIX")} /><QrCode size={22} /><span><strong>PIX</strong><small>Usar PIX nas próximas faturas</small></span></label></div></fieldset>{paymentMethod === "CREDIT_CARD" && <><fieldset><legend><CreditCard size={18} /> Dados do cartão</legend><div className="checkout-form-grid"><Field label="Nome impresso no cartão" name="holderName" values={values} errors={errors} onChange={onChange} /><Field label="Número do cartão" name="number" values={values} errors={errors} onChange={onChange} inputMode="numeric" /><Field label="Mês" name="expiryMonth" values={values} errors={errors} onChange={onChange} inputMode="numeric" placeholder="MM" /><Field label="Ano" name="expiryYear" values={values} errors={errors} onChange={onChange} inputMode="numeric" placeholder="AAAA" /><Field label="CVV" name="ccv" values={values} errors={errors} onChange={onChange} inputMode="numeric" /></div></fieldset><fieldset><legend>Dados do titular</legend><div className="checkout-form-grid holder-grid"><Field label="Nome completo" name="name" values={values} errors={errors} onChange={onChange} /><Field label="E-mail" name="email" values={values} errors={errors} onChange={onChange} type="email" /><Field label="CPF/CNPJ" name="cpfCnpj" values={values} errors={errors} onChange={onChange} inputMode="numeric" /><Field label="CEP" name="postalCode" values={values} errors={errors} onChange={onChange} inputMode="numeric" /><Field label="Número do endereço" name="addressNumber" values={values} errors={errors} onChange={onChange} /><Field label="Complemento" name="addressComplement" values={values} errors={errors} onChange={onChange} optional /><Field label="Telefone" name="phone" values={values} errors={errors} onChange={onChange} inputMode="tel" /><Field label="Celular" name="mobilePhone" values={values} errors={errors} onChange={onChange} optional inputMode="tel" /></div></fieldset></>}<button className="billing-primary checkout-submit" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="billing-spinner" size={18} /> Atualizando...</> : paymentMethod === "PIX" ? "Usar PIX" : "Salvar novo cartão"}</button></form></section></div>;
}
