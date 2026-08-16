import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  saveAuthSession,
} from "../auth/authStorage";
import {
  getMyProfessionalProfile,
  getMyUserProfile,
} from "../services/profile";

const AUTH_COOKIE_NAMES = Object.freeze({
  token: "TEMP_AUTH_TOKEN",
  role: "TEMP_ROLE",
});

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
  const expiredCookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/; SameSite=Lax`;
  document.cookie = expiredCookie;

  if (window.location.hostname.endsWith(".clickfila.com.br")) {
    document.cookie = `${expiredCookie}; Domain=.clickfila.com.br; Secure`;
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function completeGoogleLogin() {
      const token = readCookie(AUTH_COOKIE_NAMES.token);
      const role = String(readCookie(AUTH_COOKIE_NAMES.role) || "")
        .replace(/^ROLE_/i, "")
        .toUpperCase();

      deleteCookie(AUTH_COOKIE_NAMES.token);
      deleteCookie(AUTH_COOKIE_NAMES.role);

      if (!token || !ROLE_HOME[role]) {
        if (active)
          setError(
            "Não foi possível concluir o login com Google. Tente novamente.",
          );
        return;
      }

      try {
        saveAuthSession(token, role);

        // Valida o token provisório antes de liberar o acesso. Caso o backend
        // responda LGPD_PENDING, o interceptor abre o modal e esta chamada
        // permanece aguardando até receber e salvar o novo JWT.
        if (role === "PROFESSIONAL") await getMyProfessionalProfile();
        else await getMyUserProfile();

        if (active) navigate(ROLE_HOME[role], { replace: true });
      } catch (requestError) {
        clearAuthSession();
        if (active)
          setError(
            requestError?.message ||
              "Não foi possível validar seu acesso com Google. Tente novamente.",
          );
      }
    }

    completeGoogleLogin();
    return () => {
      active = false;
    };
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
