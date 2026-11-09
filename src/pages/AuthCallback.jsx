import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthSession, saveAuthSession } from "../auth/authStorage";
import ConfirmationModal from "../components/professionalDashboard/ConfirmationModal";
import { reactivateOAuth2User } from "../services/auth";
import { getMyUserProfile } from "../services/profile";

const AUTH_COOKIE_NAMES = Object.freeze({
  token: "TEMP_AUTH_TOKEN",
  refreshToken: "TEMP_REFRESH_TOKEN",
  role: "TEMP_ROLE",
  tutorialCompleted: "TEMP_TUTORIAL_COMPLETED",
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

function deleteTemporaryCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = decodeURIComponent(cookie.split("=")[0].trim());
    if (name.startsWith("TEMP_")) deleteCookie(name);
  });
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showReactivation, setShowReactivation] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  useEffect(() => {
    let active = true;

    async function completeGoogleLogin() {
      const callbackError = new URLSearchParams(window.location.search).get(
        "error",
      );

      if (callbackError === "account_deactivated") {
        window.history.replaceState(
          window.history.state,
          document.title,
          window.location.pathname,
        );
        if (active) setShowReactivation(true);
        return;
      }

      const token = readCookie(AUTH_COOKIE_NAMES.token);
      const refreshToken = readCookie(AUTH_COOKIE_NAMES.refreshToken);
      const role = String(readCookie(AUTH_COOKIE_NAMES.role) || "")
        .replace(/^ROLE_/i, "")
        .toUpperCase();
      const tutorialCookie = readCookie(AUTH_COOKIE_NAMES.tutorialCompleted);
      const tutorialCompleted = tutorialCookie === "true";

      deleteTemporaryCookies();

      if (
        !token ||
        !refreshToken ||
        !ROLE_HOME[role] ||
        !["true", "false"].includes(tutorialCookie)
      ) {
        if (active)
          setError(
            "Não foi possível concluir o login com Google. Tente novamente.",
          );
        return;
      }

      try {
        saveAuthSession(token, refreshToken, role, tutorialCompleted);

        // Valida o token provisório antes de liberar o acesso. Caso o backend
        // responda LGPD_PENDING, o interceptor abre o modal e esta chamada
        // permanece aguardando até receber e salvar o novo JWT.
        await getMyUserProfile();

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

  async function handleOAuth2Reactivation() {
    setIsReactivating(true);
    setError("");

    try {
      const response = await reactivateOAuth2User();
      const role = String(response?.role || "")
        .replace(/^ROLE_/i, "")
        .toUpperCase();

      if (!response?.token || !response?.refreshToken || !ROLE_HOME[role]) {
        throw new Error(
          "Ocorreu um problema ao carregar sua conta. Por favor, tente novamente.",
        );
      }

      saveAuthSession(
        response.token,
        response.refreshToken,
        role,
        response.tutorialCompleted === true,
        response.emailVerified ?? response.email_verified,
      );
      setShowReactivation(false);
      navigate(ROLE_HOME[role], {
        replace: true,
        state: { toast: "Conta reativada com sucesso!" },
      });
    } catch (requestError) {
      clearAuthSession();
      setShowReactivation(false);
      setError(
        requestError?.message ||
          "Não foi possível reativar sua conta. Tente entrar com o Google novamente.",
      );
    } finally {
      setIsReactivating(false);
    }
  }

  function handleKeepDeactivated() {
    setShowReactivation(false);
    navigate("/login", { replace: true });
  }

  if (showReactivation) {
    return (
      <main className="oauth-callback">
        <ConfirmationModal
          confirmation={{
            title: "Reativar conta",
            message:
              "Sua conta está em processo de exclusão. Deseja cancelar a exclusão e reativar sua conta?",
            backLabel: "Não, manter exclusão",
            confirmLabel: "Sim, reativar",
          }}
          loading={isReactivating}
          onBack={handleKeepDeactivated}
          onConfirm={handleOAuth2Reactivation}
        />
      </main>
    );
  }

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
