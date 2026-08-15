import React, { useState } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import {
  requestPasswordReset,
  resetPassword,
  validatePasswordReset,
} from "../services/auth";
import PasswordField from "./PasswordField";

export default function PasswordResetFlow({ initialEmail = "", onBack }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(action) {
    setLoading(true);
    setError("");
    try {
      await action();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleRequest(event) {
    event.preventDefault();
    run(async () => {
      await requestPasswordReset(email);
      setStep("code");
    });
  }

  function handleValidate(event) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Informe o código de 6 dígitos enviado ao seu e-mail.");
      return;
    }
    run(async () => {
      await validatePasswordReset(email, code);
      setStep("password");
    });
  }

  function handleReset(event) {
    event.preventDefault();
    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }
    run(async () => {
      await resetPassword({ email, code, newPassword });
      setStep("done");
    });
  }

  const titles = {
    email: [
      "Esqueci minha senha",
      "Informe seu e-mail para receber um código de verificação.",
    ],
    code: [
      "Verifique seu e-mail",
      `Digite o código de 6 dígitos enviado para ${email}.`,
    ],
    password: [
      "Crie uma nova senha",
      "Use pelo menos 6 caracteres para proteger sua conta.",
    ],
    done: [
      "Senha redefinida",
      "Sua nova senha foi salva. Você já pode entrar na sua conta.",
    ],
  };

  return (
    <div className="password-reset-flow">
      <button className="password-reset-back" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar ao login
      </button>
      <div className="login-auth-heading">
        <h1>{titles[step][0]}</h1>
        <p>{titles[step][1]}</p>
      </div>
      {step === "done" ? (
        <button className="login-auth-submit" type="button" onClick={onBack}>
          Entrar com a nova senha
        </button>
      ) : (
        <form
          className="login-auth-form"
          onSubmit={
            step === "email"
              ? handleRequest
              : step === "code"
                ? handleValidate
                : handleReset
          }
        >
          {error && (
            <div className="login-auth-error" role="alert">
              {error}
            </div>
          )}
          {step === "email" && (
            <label>
              E-mail
              <div className="input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </label>
          )}
          {step === "code" && (
            <label>
              Código de verificação
              <div className="input-wrap">
                <ShieldCheck size={18} />
                <input
                  className="reset-code-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  minLength={6}
                  maxLength={6}
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                />
              </div>
            </label>
          )}
          {step === "password" && (
            <>
              <PasswordField
                label="Nova senha"
                required
                minLength={6}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                visible={showNewPassword}
                setVisible={setShowNewPassword}
                placeholder="Mínimo de 6 caracteres"
                visibilityLabel="nova senha"
              />
              <PasswordField
                label="Confirmar nova senha"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                visible={showConfirmation}
                setVisible={setShowConfirmation}
                placeholder="Digite novamente"
                visibilityLabel="confirmação da senha"
              />
            </>
          )}
          <button
            className="login-auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Aguarde..."
              : step === "email"
                ? "Enviar código"
                : step === "code"
                  ? "Validar código"
                  : "Redefinir senha"}
          </button>
          {step === "code" && (
            <button
              className="forgot-password reset-resend"
              type="button"
              disabled={loading}
              onClick={() => run(() => requestPasswordReset(email))}
            >
              Reenviar código
            </button>
          )}
        </form>
      )}
    </div>
  );
}
