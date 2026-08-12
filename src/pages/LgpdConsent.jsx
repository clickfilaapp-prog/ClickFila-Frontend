import React, { useState } from "react";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { loadAuthSession, saveAuthSession } from "../auth/authStorage";
import { acceptLgpdTerms } from "../services/auth";

const RETURN_URL_KEY = "lgpdReturnUrl";

function getSafeReturnUrl(role) {
  const storedUrl = sessionStorage.getItem(RETURN_URL_KEY);
  sessionStorage.removeItem(RETURN_URL_KEY);

  if (
    storedUrl?.startsWith("/") &&
    !storedUrl.startsWith("//") &&
    !storedUrl.startsWith("/lgpd-consent") &&
    !storedUrl.startsWith("/login")
  ) {
    return storedUrl;
  }

  return role === "PROFESSIONAL" ? "/professionalDashboard" : "/clientQueue";
}

export default function LgpdConsent() {
  const navigate = useNavigate();
  const session = loadAuthSession();
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!session) return <Navigate to="/login" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!accepted || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      const response = await acceptLgpdTerms();
      const token = response?.token;
      const role = response?.role || session.role;

      if (!token) {
        throw new Error("O servidor não retornou o novo token de acesso.");
      }

      saveAuthSession(token, role);
      const normalizedRole = String(role).replace(/^ROLE_/i, "").toUpperCase();
      navigate(getSafeReturnUrl(normalizedRole), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="lgpd-page">
      <form className="lgpd-page-card" onSubmit={handleSubmit}>
        <div className="lgpd-modal-heading">
          <span><ShieldCheck size={23} /></span>
          <div>
            <small>Privacidade e proteção de dados</small>
            <h1>Atualização dos termos de privacidade</h1>
          </div>
        </div>

        <p>
          Nossos termos foram atualizados. Leia e confirme o consentimento para
          continuar usando o BarberFlow.
        </p>

        <div className="lgpd-modal-content">
          <h3>Como usamos seus dados?</h3>
          <ul>
            <li><CheckCircle2 size={15} />Para identificar e proteger sua conta.</li>
            <li><CheckCircle2 size={15} />Para viabilizar filas, atendimentos e comunicações.</li>
            <li><CheckCircle2 size={15} />Para cumprir obrigações legais aplicáveis.</li>
          </ul>
          <div className="lgpd-security-note">
            <LockKeyhole size={19} />
            <p>
              Seus dados são tratados para as finalidades informadas, com acesso
              restrito e medidas de segurança. Você pode solicitar acesso,
              correção ou exclusão, observadas as obrigações legais.
            </p>
          </div>
        </div>

        {error && <div className="login-auth-error" role="alert">{error}</div>}

        <label className="lgpd-consent-check">
          <input
            type="checkbox"
            checked={accepted}
            disabled={isSubmitting}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>Li e concordo com os termos atualizados e o tratamento descrito.</span>
        </label>

        <button className="dark lgpd-accept-button" disabled={!accepted || isSubmitting}>
          {isSubmitting ? "Atualizando acesso..." : "Aceitar e continuar"}
        </button>
      </form>
    </main>
  );
}
