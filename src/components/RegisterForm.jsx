import React, { useState } from "react";
import { ArrowLeft, Mail, UserPlus, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import PasswordField from "./PasswordField";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Formulário reutilizado pelos dois tipos de cadastro. */
export default function RegisterForm({
  role,
  onSubmit,
  isSubmitting,
  requestError,
  onBack,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const isProfessional = role === "professional";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!/^\d{10,11}$/.test(phoneDigits)) {
      setValidationError("Informe um telefone com DDD e 10 ou 11 dígitos.");
      return;
    }
    if (form.password.length < 6) {
      setValidationError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setValidationError("As senhas não conferem.");
      return;
    }
    if (!privacyAccepted || !termsAccepted) {
      setValidationError(
        "Aceite a Política de Privacidade e os Termos de Uso para continuar.",
      );
      return;
    }
    await onSubmit({ ...form, termsAccepted: true });
  }

  return (
    <form className="auth-form auth-form-transition" onSubmit={handleSubmit}>
      {(validationError || requestError) && (
        <div className="login-auth-error" role="alert">
          {validationError || requestError}
        </div>
      )}
      <label>
        Nome
        <div className="input-wrap">
          <UserRound size={17} />
          <input
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Como podemos te chamar?"
          />
        </div>
      </label>
      <label>
        Telefone
        <div className="input-wrap">
          <UserRound size={17} />
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            minLength={14}
            maxLength={15}
            value={form.phone}
            onChange={(event) =>
              updateField("phone", formatPhone(event.target.value))
            }
            placeholder="(00) 00000-0000"
            aria-describedby="phone-help"
          />
        </div>
        <small id="phone-help">
          Informe o DDD e um telefone com 10 ou 11 dígitos.
        </small>
      </label>
      <label>
        E-mail
        <div className="input-wrap">
          <Mail size={17} />
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="seu@email.com"
          />
        </div>
      </label>
      <PasswordField
        label="Senha"
        required
        minLength={6}
        value={form.password}
        onChange={(event) => updateField("password", event.target.value)}
        visible={showPassword}
        setVisible={setShowPassword}
        placeholder="Mínimo de 6 caracteres"
        visibilityLabel="senha"
      />
      <PasswordField
        label="Confirmar senha"
        required
        minLength={6}
        value={form.confirmPassword}
        onChange={(event) => updateField("confirmPassword", event.target.value)}
        visible={showConfirmPassword}
        setVisible={setShowConfirmPassword}
        placeholder="Digite a senha novamente"
        visibilityLabel="confirmação"
      />
      <div className="registration-consent-options">
        <label className="lgpd-consent-check">
          <input
            type="checkbox"
            required
            checked={privacyAccepted}
            disabled={isSubmitting}
            onChange={(event) => setPrivacyAccepted(event.target.checked)}
          />
          <span>
            Li e aceito a{" "}
            <Link
              to="/politica-de-privacidade"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de Privacidade
            </Link>
            .
          </span>
        </label>

        <label className="lgpd-consent-check">
          <input
            type="checkbox"
            required
            checked={termsAccepted}
            disabled={isSubmitting}
            onChange={(event) => setTermsAccepted(event.target.checked)}
          />
          <span>
            Li e concordo com os{" "}
            <Link
              to="/termos-de-uso"
              target="_blank"
              rel="noopener noreferrer"
            >
              Termos de Uso
            </Link>
            , incluindo as regras de funcionamento da fila.
          </span>
        </label>
      </div>
      <button
        className="dark"
        type="submit"
        disabled={!privacyAccepted || !termsAccepted || isSubmitting}
      >
        {isSubmitting
          ? "Criando cadastro..."
          : isProfessional
            ? "Criar acesso profissional"
            : "Criar cadastro de cliente"}{" "}
        <UserPlus size={18} />
      </button>
      <button className="back-to-login" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar
      </button>
    </form>
  );
}
