import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  LoaderCircle,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import PixPaymentModal from "../components/billing/PixPaymentModal";
import {
  clearProfessionalDashboardCache,
  getMyBusiness,
  getProfessionalDashboard,
} from "../services/queue";
import {
  changeSubscriptionPlan,
  createSubscriptionCheckout,
  getMySubscription,
  getPlans,
} from "../services/billing";
import { isValidCpfCnpj } from "../utils/documentValidation";
import { useViaCep } from "../hooks/useViaCep";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const EMPTY_FORM = {
  holderName: "",
  number: "",
  expiryMonth: "",
  expiryYear: "",
  ccv: "",
  name: "",
  email: "",
  cpfCnpj: "",
  postalCode: "",
  addressNumber: "",
  addressComplement: "",
  phone: "",
  mobilePhone: "",
};
const FIELDS = new Set(Object.keys(EMPTY_FORM));
const firstValue = (...values) =>
  values.find(
    (value) => value !== undefined && value !== null && value !== "",
  ) ?? "";
const digits = (value, limit) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, limit);

function validate(values) {
  const errors = {};
  const required = {
    holderName: "Informe o nome impresso no cartão.",
    number: "Informe o número do cartão.",
    expiryMonth: "Informe o mês de validade.",
    expiryYear: "Informe o ano de validade.",
    ccv: "Informe o CVV.",
    name: "Informe o nome do titular.",
    email: "Informe o e-mail do titular.",
    cpfCnpj: "Informe o CPF ou CNPJ.",
    postalCode: "Informe o CEP.",
    addressNumber: "Informe o número do endereço.",
    phone: "Informe o telefone.",
  };
  Object.entries(required).forEach(([field, message]) => {
    if (!String(values[field] || "").trim()) errors[field] = message;
  });
  if (values.number && !/^\d{13,19}$/.test(values.number))
    errors.number = "Número do cartão inválido.";
  if (
    values.expiryMonth &&
    (Number(values.expiryMonth) < 1 || Number(values.expiryMonth) > 12)
  )
    errors.expiryMonth = "Mês de validade inválido.";
  if (values.expiryYear && !/^\d{4}$/.test(values.expiryYear))
    errors.expiryYear = "Use o ano com 4 dígitos.";
  if (values.ccv && !/^\d{3,4}$/.test(values.ccv))
    errors.ccv = "O CVV deve ter 3 ou 4 dígitos.";
  if (values.email && values.email.length > 50)
    errors.email = "O e-mail deve ter no máximo 50 caracteres.";
  else if (values.email && !values.email.includes("@"))
    errors.email = "O e-mail deve conter @.";
  else if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = "E-mail inválido.";
  if (values.cpfCnpj && !isValidCpfCnpj(values.cpfCnpj))
    errors.cpfCnpj = "CPF/CNPJ inválido";
  if (values.postalCode && values.postalCode.length !== 8)
    errors.postalCode = "CEP inválido.";
  if (values.phone && ![10, 11].includes(values.phone.length))
    errors.phone = "Telefone inválido.";
  if (values.mobilePhone && ![10, 11].includes(values.mobilePhone.length))
    errors.mobilePhone = "Celular inválido.";
  return errors;
}

function responseErrors(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const errors = {};
  const add = (rawField, message) => {
    const field = String(rawField || "")
      .split(".")
      .pop();
    if (FIELDS.has(field) && message) errors[field] = String(message);
  };
  Object.entries(data).forEach(([field, message]) => {
    if (typeof message === "string") add(field, message);
  });
  [
    data.errors,
    data.fieldErrors,
    data.validationErrors,
    data.violations,
  ].forEach((collection) => {
    if (Array.isArray(collection))
      collection.forEach((item) =>
        add(
          item?.field || item?.propertyPath,
          item?.message || item?.defaultMessage,
        ),
      );
    else if (collection && typeof collection === "object")
      Object.entries(collection).forEach(([field, message]) =>
        add(field, message),
      );
  });
  return errors;
}

function Field({
  label,
  name,
  values,
  errors,
  onChange,
  optional = false,
  inputMode,
  ...props
}) {
  if (name === "mobilePhone" || name === "addressComplement") return null;
  const error = errors[name];
  const effectiveInputMode =
    inputMode || (name === "addressNumber" ? "numeric" : undefined);
  const field = (
    <label className={`checkout-field${error ? " has-error" : ""}`}>
      <span>
        {label}
        {optional && <small> (opcional)</small>}
      </span>
      <input
        name={name}
        value={values[name]}
        onChange={onChange}
        onBlur={
          name === "postalCode"
            ? () =>
                window.dispatchEvent(
                  new CustomEvent("billing:lookup-cep", {
                    detail: values.postalCode,
                  }),
                )
            : props.onBlur
        }
        inputMode={effectiveInputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `checkout-${name}-error` : undefined}
        {...props}
      />
      {error && (
        <small id={`checkout-${name}-error`} className="checkout-field-error">
          {error}
        </small>
      )}
    </label>
  );
  return field;
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
  const [savedCard] = useState(location.state?.savedCard || null);
  const [cardChoice, setCardChoice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [pixData, setPixData] = useState(null);
  const [pixCopied, setPixCopied] = useState(false);
  const { loadingCep } = useViaCep(setValues, setErrors);

  useEffect(() => {
    let active = true;
    Promise.all([
      getProfessionalDashboard(),
      getMyBusiness().catch(() => null),
      plan ? Promise.resolve([]) : getPlans(),
    ])
      .then(([dashboard, businessResponse, plans]) => {
        if (!active) return;
        if (String(dashboard?.loggedMemberRole || "").toUpperCase() !== "OWNER")
          return navigate("/professionalDashboard", { replace: true });
        const selected =
          plan || plans.find((item) => String(item.code) === String(planId));
        if (!selected) {
          setError("O plano selecionado não foi encontrado.");
          return;
        }
        setPlan(selected);
        const business =
          businessResponse?.data ||
          businessResponse?.business ||
          businessResponse ||
          {};
        setValues((current) => ({
          ...current,
          name: firstValue(business?.ownerName, business?.user?.name),
          email: firstValue(business?.user?.login, business?.email),
          cpfCnpj: digits(
            firstValue(business?.cpfCnpj, business?.document, business?.taxId),
            14,
          ),
          phone: digits(firstValue(business?.user?.phone, business?.phone), 11),
        }));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [changingPlan, navigate, planId]);

  function onChange(event) {
    const { name, value } = event.target;
    const limits = {
      number: 19,
      expiryMonth: 2,
      expiryYear: 4,
      ccv: 4,
      cpfCnpj: 14,
      postalCode: 8,
      addressNumber: 10,
      phone: 11,
      mobilePhone: 11,
    };
    setValues((current) => ({
      ...current,
      [name]: limits[name] ? digits(value, limits[name]) : value,
    }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (!changingPlan && !paymentMethod) {
      setError("Escolha uma forma de pagamento para continuar.");
      return;
    }
    if (changingPlan && !cardChoice) {
      setError("Escolha uma forma de pagamento para continuar.");
      return;
    }
    const usingPix = changingPlan
      ? cardChoice === "pix"
      : paymentMethod === "PIX";
    const usingNewCard = changingPlan
      ? cardChoice === "new"
      : paymentMethod === "CREDIT_CARD";
    const validation = usingNewCard ? validate(values) : {};
    setErrors(validation);
    setError("");
    if (Object.keys(validation).length) {
      setError("Verifique os campos destacados e corrija os dados inválidos.");
      window.setTimeout(() => {
        const firstInvalidField = document.querySelector(
          ".checkout-page .checkout-field.has-error input",
        );
        firstInvalidField?.focus();
        firstInvalidField?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 0);
      return;
    }
    setSubmitting(true);
    try {
      const cardPayload = usingNewCard
        ? {
            creditCard: {
              holderName: values.holderName.trim(),
              number: values.number,
              expiryMonth: values.expiryMonth.padStart(2, "0"),
              expiryYear: values.expiryYear,
              ccv: values.ccv,
            },
            creditCardHolderInfo: {
              name: values.name.trim(),
              email: values.email.trim(),
              cpfCnpj: values.cpfCnpj,
              postalCode: values.postalCode,
              addressNumber: values.addressNumber.trim(),
              phone: values.phone,
            },
          }
        : cardChoice === "saved"
          ? { savedCardId: savedCard.id }
          : {};
      const payload = {
        planId: plan.code,
        paymentMethod: usingPix ? "PIX" : "CREDIT_CARD",
        ...cardPayload,
      };
      if (changingPlan) await changeSubscriptionPlan(payload);
      else {
        const response = await createSubscriptionCheckout(payload);
        if (usingPix) {
          if (!response?.pixQrCodeBase64) {
            clearProfessionalDashboardCache();
            navigate("/professionalDashboard", {
              replace: true,
              state: {
                message:
                  "Reativação agendada com sucesso. Você continuará com acesso durante o período já pago.",
              },
            });
            return;
          }
          if (!response?.pixCopiaECola)
            throw new Error("A API não retornou o código PIX copia e cola.");
          setPixData(response);
        }
      }
      setValues((current) => ({ ...current, ccv: "" }));
      if (changingPlan || !usingPix) setSuccess(true);
      clearProfessionalDashboardCache();
      getMySubscription().catch(() => {});
    } catch (requestError) {
      setValues((current) => ({ ...current, ccv: "" }));

      if ([400, 422].includes(requestError.status) && requestError.data) {
        const fieldErrors = responseErrors(requestError.data);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          setError("");
          return;
        }
      }

      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPixCode() {
    try {
      await navigator.clipboard.writeText(pixData.pixCopiaECola);
      setPixCopied(true);
      window.setTimeout(() => setPixCopied(false), 2500);
    } catch {
      setError(
        "Não foi possível copiar automaticamente. Selecione o código PIX e copie manualmente.",
      );
    }
  }

  return (
    <DashboardLayout tutorialReady={false}>
      <main className="checkout-page">
        {pixData && (
          <PixPaymentModal
            pixData={pixData}
            onClose={() => navigate("/billing", { replace: true })}
          />
        )}
        <button
          className="checkout-back"
          type="button"
          onClick={() => navigate("/billing")}
        >
          <ArrowLeft size={18} /> Voltar para assinatura
        </button>
        {loading ? (
          <div className="checkout-page-card checkout-loading">
            <LoaderCircle className="billing-spinner" /> Carregando pagamento...
          </div>
        ) : pixData ? (
          <section className="checkout-page-card pix-payment" role="status">
            <div className="pix-waiting">
              <Clock3 />
              <div>
                <h1>Aguardando pagamento...</h1>
                <p>
                  Abra o app do seu banco, pague o PIX e aguarde alguns segundos
                  enquanto confirmamos o recebimento.
                </p>
              </div>
            </div>
            <img
              className="pix-qr-code"
              src={`data:image/png;base64,${pixData.pixQrCodeBase64}`}
              alt="QR Code para pagamento via PIX"
            />
            <label className="pix-copy-label" htmlFor="pix-copy-code">
              PIX copia e cola
            </label>
            <div className="pix-copy-row">
              <textarea
                id="pix-copy-code"
                value={pixData.pixCopiaECola}
                readOnly
                rows={3}
              />
              <button
                className="billing-primary"
                type="button"
                onClick={copyPixCode}
              >
                <Copy size={17} /> {pixCopied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <p className="pix-activation-note">
              Seu acesso será liberado automaticamente após a confirmação do
              pagamento.
            </p>
            <button
              className="checkout-back pix-back"
              type="button"
              onClick={() => navigate("/billing")}
            >
              Voltar para assinatura
            </button>
          </section>
        ) : success ? (
          <section
            className="checkout-page-card checkout-success"
            role="status"
          >
            <CheckCircle2 size={64} />
            <h1>
              {changingPlan
                ? "Troca de plano agendada"
                : "Pagamento enviado com sucesso"}
            </h1>
            <p>
              {changingPlan
                ? "O novo plano será cobrado e entrará em vigor ao final do ciclo já pago."
                : "Estamos aguardando a confirmação do pagamento. Seu acesso será ativado automaticamente em seguida."}
            </p>
            <button
              className="billing-primary"
              type="button"
              onClick={() =>
                navigate(changingPlan ? "/billing" : "/professionalDashboard", {
                  replace: true,
                  state: {
                    toast: changingPlan
                      ? "Troca de plano agendada com sucesso!"
                      : "Pagamento enviado com sucesso!",
                  },
                })
              }
            >
              {changingPlan ? "Voltar para assinatura" : "Ir para o painel"}
            </button>
          </section>
        ) : (
          <section className="checkout-page-card">
            <div className="checkout-heading">
              <ShieldCheck />
              <div>
                <span className="step">PAGAMENTO</span>
                <h1>
                  {changingPlan
                    ? "Confirme a troca de plano"
                    : "Finalize sua assinatura"}
                </h1>
                <p>
                  {plan?.name}{" "}
                  {Number(plan?.price) > 0 &&
                    `• ${money.format(Number(plan.price))}`}
                </p>
              </div>
            </div>
            {error && (
              <div
                className="login-auth-error checkout-payment-error"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}
            {changingPlan && plan && (
              <fieldset className="pix-plan-choice">
                <legend>
                  <QrCode size={18} /> PIX
                </legend>
                <label
                  className={`card-choice simple-payment-choice${cardChoice === "pix" ? " selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="cardChoice"
                    value="pix"
                    checked={cardChoice === "pix"}
                    onChange={() => {
                      setCardChoice("pix");
                      setErrors({});
                      setError("");
                    }}
                  />
                  <QrCode size={22} />
                  <strong>PIX</strong>
                </label>
              </fieldset>
            )}
            {plan && (
              <form onSubmit={submit} noValidate>
                {!changingPlan && (
                  <fieldset className="card-choice-fieldset">
                    <legend>Forma de pagamento</legend>
                    <div className="card-choice-list payment-method-list">
                      <label
                        className={`card-choice${paymentMethod === "CREDIT_CARD" ? " selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CREDIT_CARD"
                          checked={paymentMethod === "CREDIT_CARD"}
                          onChange={() => {
                            setPaymentMethod("CREDIT_CARD");
                            setErrors({});
                            setError("");
                          }}
                        />
                        <CreditCard size={22} />
                        <span>
                          <strong>Cartão de crédito</strong>
                          <small>Pagamento processado com segurança</small>
                        </span>
                      </label>
                      <label
                        className={`card-choice${paymentMethod === "PIX" ? " selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="PIX"
                          checked={paymentMethod === "PIX"}
                          onChange={() => {
                            setPaymentMethod("PIX");
                            setErrors({});
                            setError("");
                          }}
                        />
                        <QrCode size={22} />
                        <span>
                          <strong>PIX</strong>
                          <small>Use o QR Code ou o código copia e cola</small>
                        </span>
                      </label>
                    </div>
                  </fieldset>
                )}
                {changingPlan && (
                  <fieldset className="card-choice-fieldset">
                    <legend>
                      <CreditCard size={18} /> Forma de pagamento
                    </legend>
                    <div className="card-choice-list">
                      {savedCard && (
                        <label
                          className={`card-choice${cardChoice === "saved" ? " selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="cardChoice"
                            value="saved"
                            checked={cardChoice === "saved"}
                            onChange={() => {
                              setCardChoice("saved");
                              setErrors({});
                              setError("");
                            }}
                          />
                          <CreditCard size={22} />
                          <span>
                            <strong>
                              Usar {savedCard.brand || "cartão"} final{" "}
                              {savedCard.lastFourDigits}
                            </strong>
                            <small>Cartão já cadastrado</small>
                          </span>
                        </label>
                      )}
                      <label
                        className={`card-choice simple-payment-choice${cardChoice === "new" ? " selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="cardChoice"
                          value="new"
                          checked={cardChoice === "new"}
                          onChange={() => {
                            setCardChoice("new");
                            setErrors({});
                            setError("");
                          }}
                        />
                        <CreditCard size={22} />
                        <strong>Cartão</strong>
                      </label>
                    </div>
                  </fieldset>
                )}
                {((!changingPlan && paymentMethod === "CREDIT_CARD") ||
                  (changingPlan && cardChoice === "new")) && (
                  <>
                    <fieldset>
                      <legend>
                        <CreditCard size={18} /> Dados do cartão
                      </legend>
                      <div className="checkout-form-grid">
                        <Field
                          label="Nome impresso no cartão"
                          name="holderName"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          maxLength={50}
                          autoComplete="cc-name"
                        />
                        <Field
                          label="Número do cartão"
                          name="number"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="0000 0000 0000 0000"
                        />
                        <Field
                          label="Mês"
                          name="expiryMonth"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          inputMode="numeric"
                          autoComplete="cc-exp-month"
                          placeholder="MM"
                        />
                        <Field
                          label="Ano"
                          name="expiryYear"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          inputMode="numeric"
                          autoComplete="cc-exp-year"
                          placeholder="AAAA"
                        />
                        <Field
                          label="CVV"
                          name="ccv"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          placeholder="123"
                        />
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend>Dados do titular</legend>
                      <p className="checkout-section-note">
                        Estas informações são obrigatórias para a análise
                        antifraude.
                      </p>
                      <div className="checkout-form-grid holder-grid">
                        <Field
                          label="Nome completo"
                          name="name"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          maxLength={50}
                          autoComplete="name"
                        />
                        <Field
                          label="E-mail"
                          name="email"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          type="email"
                          maxLength={50}
                          autoComplete="email"
                        />
                        <Field
                          label="CPF/CNPJ"
                          name="cpfCnpj"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          inputMode="numeric"
                        />
                        <Field
                          label="CEP"
                          name="postalCode"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          inputMode="numeric"
                          autoComplete="postal-code"
                        />
                        <Field
                          label="Número do endereço"
                          name="addressNumber"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          maxLength={10}
                        />
                        <Field
                          label="Complemento"
                          name="addressComplement"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          maxLength={20}
                          optional
                        />
                        <Field
                          label="Telefone"
                          name="phone"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          inputMode="tel"
                          autoComplete="tel"
                        />
                        <Field
                          label="Celular"
                          name="mobilePhone"
                          values={values}
                          errors={errors}
                          onChange={onChange}
                          optional
                          inputMode="tel"
                        />
                      </div>
                    </fieldset>
                  </>
                )}
                {!changingPlan && paymentMethod === "PIX" && (
                  <p className="plan-change-note">
                    Após continuar, exibiremos o QR Code e o código PIX copia e
                    cola.
                  </p>
                )}
                {changingPlan && (
                  <p className="plan-change-note">
                    A nova assinatura será agendada para o fim do ciclo atual.
                  </p>
                )}
                <button
                  className="billing-primary checkout-submit"
                  type="submit"
                  disabled={
                    submitting ||
                    (!changingPlan && !paymentMethod) ||
                    (changingPlan && !cardChoice)
                  }
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="billing-spinner" size={18} />{" "}
                      Processando...
                    </>
                  ) : changingPlan && !cardChoice ? (
                    "Escolha a forma de pagamento"
                  ) : changingPlan ? (
                    "Confirmar troca de plano"
                  ) : paymentMethod === "PIX" ? (
                    "Assinar com PIX"
                  ) : paymentMethod === "CREDIT_CARD" ? (
                    "Assinar com cartão"
                  ) : (
                    "Escolha a forma de pagamento"
                  )}
                </button>
              </form>
            )}
          </section>
        )}
      </main>
    </DashboardLayout>
  );
}
