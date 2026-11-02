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
  const [passwordError, setPasswordError] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const isProfessional = role === "professional";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "password" || field === "confirmPassword")
      setPasswordError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");
    setPasswordError("");
    const phoneDigits = form.phone.replace(/\D/g, "");
    const normalizedName = form.name.trim();
    if (normalizedName.length < 3 || normalizedName.length > 50) {
      setValidationError("O nome deve ter entre 3 e 50 caracteres.");
      return;
    }
    if (!/^\d{10,11}$/.test(phoneDigits)) {
      setValidationError("Informe um telefone com DDD e 10 ou 11 dígitos.");
      return;
    }
    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,12}$/.test(
        form.password,
      )
    ) {
      setPasswordError(
        "Use de 8 a 12 caracteres, com letra maiúscula, minúscula, número e caractere especial.",
      );
      return;
    }
    if (form.password !== form.confirmPassword) {
      setPasswordError("As senhas não conferem.");
      setValidationError("As senhas não conferem.");
      return;
    }
    if (!privacyAccepted || !termsAccepted) {
      setValidationError(
        "Aceite a Política de Privacidade e os Termos de Uso para continuar.",
      );
      return;
    }
    await onSubmit({ ...form, name: normalizedName, termsAccepted: true });
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
            minLength={3}
            maxLength={50}
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
        minLength={8}
        maxLength={12}
        value={form.password}
        onChange={(event) => updateField("password", event.target.value)}
        visible={showPassword}
        setVisible={setShowPassword}
        placeholder="Crie uma senha forte"
        visibilityLabel="senha"
        helpText="Use de 8 a 12 caracteres, com maiúscula, minúscula, número e caractere especial."
        error={passwordError}
      />
      <PasswordField
        label="Confirmar senha"
        required
        minLength={8}
        maxLength={12}
        value={form.confirmPassword}
        onChange={(event) => updateField("confirmPassword", event.target.value)}
        visible={showConfirmPassword}
        setVisible={setShowConfirmPassword}
        placeholder="Digite a senha novamente"
        error={
          passwordError && form.password !== form.confirmPassword
            ? passwordError
            : ""
        }
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
            <Link to="/termos-de-uso" target="_blank" rel="noopener noreferrer">
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
