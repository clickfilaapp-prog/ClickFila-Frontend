import React, { useState } from "react";
import { MailCheck, X } from "lucide-react";
import { updateEmailVerified } from "../auth/authStorage";
import { refreshAuthSession } from "../services/api";
import { resendEmailOtp, verifyEmail } from "../services/auth";

export default function EmailVerificationNotice({ onVerified, inline = false }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleVerify(event) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Informe o código de 6 dígitos enviado por e-mail.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyEmail(code);
      await refreshAuthSession();
      updateEmailVerified(true);
      setOpen(false);
      onVerified?.();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    setMessage("");
    try {
      await resendEmailOtp();
      setMessage("Um novo código foi enviado para seu e-mail.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setResending(false);
    }
  }

  const verificationForm = (
    <>
      <MailCheck className="email-verification-icon" size={34} aria-hidden="true" />
      <h2 id="email-verification-title">Verifique seu e-mail</h2>
      <p>
        Digite o código de 6 dígitos enviado para seu e-mail. Essa verificação
        é necessária para desbloquear a criação da barbearia, as filas e o
        gerenciamento da equipe.
      </p>
      <form onSubmit={handleVerify}>
        <label htmlFor="email-verification-code">Código de verificação</label>
        <input id="email-verification-code" autoFocus required inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} placeholder="000000" />
        {error && <div className="login-auth-error" role="alert">{error}</div>}
        {message && <div className="login-auth-success" role="status">{message}</div>}
        <button className="login-auth-submit" type="submit" disabled={loading || resending}>{loading ? "Validando..." : "Validar código"}</button>
        <button className="email-verification-resend" type="button" disabled={loading || resending} onClick={handleResend}>{resending ? "Reenviando..." : "Reenviar código"}</button>
      </form>
    </>
  );

  if (inline) {
    return (
      <main className="email-verification-page">
        <section className="email-verification-inline">
          {verificationForm}
        </section>
      </main>
    );
  }

  return (
    <>
      <aside className="email-verification-notice" role="status">
        <MailCheck size={22} aria-hidden="true" />
        <div>
          <strong>Confirme seu e-mail para liberar todos os recursos.</strong>
          <span>Criação de barbearia, filas e equipe permanecem bloqueadas.</span>
        </div>
        <button type="button" onClick={() => setOpen(true)}>Verificar e-mail</button>
      </aside>
      {open && (
        <div className="email-verification-modal" role="dialog" aria-modal="true" aria-labelledby="email-verification-title">
          <section>
            <button className="email-verification-close" type="button" aria-label="Fechar" onClick={() => setOpen(false)} disabled={loading}><X size={20} /></button>
            {verificationForm}
          </section>
        </div>
      )}
    </>
  );
}
