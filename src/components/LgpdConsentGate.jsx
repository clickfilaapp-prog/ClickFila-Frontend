import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from "../auth/authStorage";
import {
  cancelPendingLgpdConsent,
  completePendingLgpdConsent,
} from "../services/api";
import { acceptLgpdTerms } from "../services/auth";
import LgpdConsentModal from "./LgpdConsentModal";

export default function LgpdConsentGate({ children }) {
  const navigate = useNavigate();
  const [lgpdPending, setLgpdPending] = useState(false);
  const [acceptingLgpd, setAcceptingLgpd] = useState(false);
  const [lgpdError, setLgpdError] = useState("");

  useEffect(() => {
    function showLgpdTerms() {
      setLgpdError("");
      setLgpdPending(true);
    }

    window.addEventListener("barberflow:lgpd-consent-required", showLgpdTerms);
    return () =>
      window.removeEventListener(
        "barberflow:lgpd-consent-required",
        showLgpdTerms,
      );
  }, []);

  const leaveConsentFlow = useCallback(() => {
    cancelPendingLgpdConsent();
    clearAuthSession();
    setLgpdPending(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  async function acceptPendingTerms() {
    if (acceptingLgpd) return;
    setAcceptingLgpd(true);
    setLgpdError("");

    try {
      const currentSession = loadAuthSession();
      const response = await acceptLgpdTerms();
      const newToken = response?.token;
      const newRefreshToken = response?.refreshToken;
      const role = response?.role || currentSession?.role;

      if (!newToken || !newRefreshToken) {
        throw new Error("O servidor não retornou o novo token de acesso.");
      }

      saveAuthSession(newToken, newRefreshToken, role);
      setLgpdPending(false);
      completePendingLgpdConsent(newToken);
    } catch (error) {
      if (error?.status === 401) {
        leaveConsentFlow();
      } else {
        setLgpdError(
          error?.message ||
            "Não foi possível registrar o aceite. Tente novamente.",
        );
      }
    } finally {
      setAcceptingLgpd(false);
    }
  }

  const session = loadAuthSession();

  return (
    <>
      {children}
      {lgpdPending && (
        <LgpdConsentModal
          accessFlow
          isProfessional={session?.role === "PROFESSIONAL"}
          isSubmitting={acceptingLgpd}
          error={lgpdError}
          onClose={leaveConsentFlow}
          onConfirm={acceptPendingTerms}
        />
      )}
    </>
  );
}
