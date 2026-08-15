import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { saveAuthSession } from "../auth/authStorage";

const ROLE_HOME = Object.freeze({
  USER: "/clientQueue",
  PROFESSIONAL: "/professionalDashboard",
});

function readCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

function deleteCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = readCookie("TEMP_AUTH_TOKEN");
    const role = String(readCookie("TEMP_ROLE") || "")
      .replace(/^ROLE_/i, "")
      .toUpperCase();

    if (!token || !ROLE_HOME[role]) {
      deleteCookie("TEMP_AUTH_TOKEN");
      deleteCookie("TEMP_ROLE");
      setError("Não foi possível concluir o login com Google. Tente novamente.");
      return;
    }

    saveAuthSession(token, role);
    deleteCookie("TEMP_AUTH_TOKEN");
    deleteCookie("TEMP_ROLE");
    navigate(ROLE_HOME[role], { replace: true });
  }, [navigate]);

  if (error) {
    return (
      <main className="oauth-callback">
        <section>
          <h1>Falha no login</h1>
          <div className="login-auth-error" role="alert">
            {error}
          </div>
          <Link className="oauth-back-link" to="/login">
            Voltar ao login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="oauth-callback">
      <section>
        <div className="oauth-spinner" aria-hidden="true" />
        <h1>Concluindo seu acesso...</h1>
        <p>Aguarde enquanto conectamos sua conta Google.</p>
      </section>
    </main>
  );
}
