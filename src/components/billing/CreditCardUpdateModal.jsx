import React, { useState } from "react";
import { CreditCard, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { updateSubscriptionCreditCard } from "../../services/billing";

const EMPTY = { holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "", name: "", email: "", cpfCnpj: "", postalCode: "", addressNumber: "", addressComplement: "", phone: "", mobilePhone: "" };
const FIELD_NAMES = new Set(Object.keys(EMPTY));
const digits = (value, limit) => String(value || "").replace(/\D/g, "").slice(0, limit);

function validate(values) {
  const errors = {};
  const required = { holderName: "Informe o nome impresso no cartão.", number: "Informe o número do cartão.", expiryMonth: "Informe o mês de validade.", expiryYear: "Informe o ano de validade.", ccv: "Informe o CVV.", name: "Informe o nome do titular.", email: "Informe o e-mail do titular.", cpfCnpj: "Informe o CPF ou CNPJ.", postalCode: "Informe o CEP.", addressNumber: "Informe o número do endereço.", phone: "Informe o telefone." };
  Object.entries(required).forEach(([field, message]) => { if (!String(values[field] || "").trim()) errors[field] = message; });
  if (values.number && !/^\d{13,19}$/.test(values.number)) errors.number = "Número do cartão inválido.";
  if (values.expiryMonth && (Number(values.expiryMonth) < 1 || Number(values.expiryMonth) > 12)) errors.expiryMonth = "Mês de validade inválido.";
  if (values.expiryYear && !/^\d{4}$/.test(values.expiryYear)) errors.expiryYear = "Use o ano com 4 dígitos.";
  if (values.ccv && !/^\d{3,4}$/.test(values.ccv)) errors.ccv = "O CVV deve ter 3 ou 4 dígitos.";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "E-mail inválido.";
  if (values.cpfCnpj && ![11, 14].includes(values.cpfCnpj.length)) errors.cpfCnpj = "CPF ou CNPJ inválido.";
  if (values.postalCode && values.postalCode.length !== 8) errors.postalCode = "CEP inválido.";
  if (values.phone && ![10, 11].includes(values.phone.length)) errors.phone = "Telefone inválido.";
  if (values.mobilePhone && ![10, 11].includes(values.mobilePhone.length)) errors.mobilePhone = "Celular inválido.";
  return errors;
}

function responseErrors(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const errors = {};
  const add = (rawField, message) => { const field = String(rawField || "").split(".").pop(); if (FIELD_NAMES.has(field) && message) errors[field] = String(message); };
  Object.entries(data).forEach(([field, message]) => { if (typeof message === "string") add(field, message); });
  [data.errors, data.fieldErrors, data.validationErrors, data.violations].forEach((collection) => {
    if (Array.isArray(collection)) collection.forEach((item) => add(item?.field || item?.propertyPath, item?.message || item?.defaultMessage));
    else if (collection && typeof collection === "object") Object.entries(collection).forEach(([field, message]) => add(field, message));
  });
  return errors;
}

function Field({ label, name, values, errors, onChange, optional = false, ...props }) {
  const error = errors[name];
  return <label className={`checkout-field${error ? " has-error" : ""}`}><span>{label}{optional && <small> (opcional)</small>}</span><input name={name} value={values[name]} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `card-update-${name}-error` : undefined} {...props} />{error && <small id={`card-update-${name}-error`} className="checkout-field-error">{error}</small>}</label>;
}

export default function CreditCardUpdateModal({ planId, initialValues = {}, onClose, onSuccess, onInvalidSubscription }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initialValues, cpfCnpj: digits(initialValues.cpfCnpj, 14), phone: digits(initialValues.phone, 11) }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      await updateSubscriptionCreditCard({ planId, creditCard: { holderName: values.holderName.trim(), number: values.number, expiryMonth: values.expiryMonth.padStart(2, "0"), expiryYear: values.expiryYear, ccv: values.ccv }, creditCardHolderInfo: { name: values.name.trim(), email: values.email.trim(), cpfCnpj: values.cpfCnpj, postalCode: values.postalCode, addressNumber: values.addressNumber.trim(), ...(values.addressComplement.trim() && { addressComplement: values.addressComplement.trim() }), phone: values.phone, ...(values.mobilePhone && { mobilePhone: values.mobilePhone }) } });
      onSuccess();
    } catch (requestError) {
      setValues((current) => ({ ...current, ccv: "" }));
      if (["INVALID_SUBSCRIPTION", "SUBSCRIPTION_NOT_FOUND"].includes(requestError.code) || requestError.status === 404) { onInvalidSubscription(); return; }
      if (requestError.code === "PAYMENT_REJECTED") setError(requestError.message);
      else {
        const fieldErrors = responseErrors(requestError.data);
        if (requestError.status === 400 && Object.keys(fieldErrors).length) { setErrors(fieldErrors); setError("Confira os campos destacados e tente novamente."); }
        else setError(requestError.message);
      }
    } finally { setSubmitting(false); }
  }

  return <div className="checkout-modal-backdrop" role="presentation"><section className="checkout-modal card-update-modal" role="dialog" aria-modal="true" aria-labelledby="card-update-title"><button className="checkout-close" type="button" aria-label="Fechar" disabled={submitting} onClick={onClose}><X /></button><div className="checkout-heading"><ShieldCheck /><div><h2 id="card-update-title">Atualizar cartão</h2><p>Informe os dados do novo cartão da assinatura.</p></div></div>{error && <div className="checkout-alert" role="alert">{error}</div>}<form onSubmit={submit} noValidate><fieldset><legend><CreditCard size={18} /> Dados do cartão</legend><div className="checkout-form-grid"><Field label="Nome impresso no cartão" name="holderName" values={values} errors={errors} onChange={onChange} autoComplete="cc-name" /><Field label="Número do cartão" name="number" values={values} errors={errors} onChange={onChange} inputMode="numeric" autoComplete="cc-number" /><Field label="Mês" name="expiryMonth" values={values} errors={errors} onChange={onChange} inputMode="numeric" placeholder="MM" /><Field label="Ano" name="expiryYear" values={values} errors={errors} onChange={onChange} inputMode="numeric" placeholder="AAAA" /><Field label="CVV" name="ccv" values={values} errors={errors} onChange={onChange} inputMode="numeric" autoComplete="cc-csc" /></div></fieldset><fieldset><legend>Dados do titular</legend><p className="checkout-section-note">Informações necessárias para a análise antifraude.</p><div className="checkout-form-grid holder-grid"><Field label="Nome completo" name="name" values={values} errors={errors} onChange={onChange} /><Field label="E-mail" name="email" values={values} errors={errors} onChange={onChange} type="email" /><Field label="CPF/CNPJ" name="cpfCnpj" values={values} errors={errors} onChange={onChange} inputMode="numeric" /><Field label="CEP" name="postalCode" values={values} errors={errors} onChange={onChange} inputMode="numeric" /><Field label="Número do endereço" name="addressNumber" values={values} errors={errors} onChange={onChange} /><Field label="Complemento" name="addressComplement" values={values} errors={errors} onChange={onChange} optional /><Field label="Telefone" name="phone" values={values} errors={errors} onChange={onChange} inputMode="tel" /><Field label="Celular" name="mobilePhone" values={values} errors={errors} onChange={onChange} optional inputMode="tel" /></div></fieldset><button className="billing-primary checkout-submit" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="billing-spinner" size={18} /> Atualizando...</> : "Atualizar cartão"}</button></form></section></div>;
}
