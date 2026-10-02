import React, { useEffect, useState } from "react";
import {
  CircleHelp,
  LayoutDashboard,
  ListPlus,
  LogOut,
  Mail,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  loadAuthSession,
  updateTutorialCompleted,
} from "../auth/authStorage";
import { completeTutorial } from "../services/auth";
import { ProfileSettingsContent } from "../pages/ProfileSettings";
import ConfirmationModal from "./professionalDashboard/ConfirmationModal";
import SiteFooter from "./SiteFooter";
import SystemTutorialModal from "./SystemTutorialModal";

/** Estrutura reutilizada somente pelas áreas autenticadas. */
export default function DashboardLayout({
  children,
  showInvites = false,
  pendingInviteCount = 0,
  onOpenInvites = null,
  tutorialReady = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionRole = loadAuthSession()?.role || "USER";
  const tutorialRole =
    sessionRole === "PROFESSIONAL" && location.pathname === "/clientQueue"
      ? "USER"
      : sessionRole;
  const [profileOpen, setProfileOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(
    () =>
      tutorialReady && loadAuthSession()?.tutorialCompleted === false,
  );
  const [completingTutorial, setCompletingTutorial] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [toast, setToast] = useState(location.state?.toast || "");

  useEffect(() => {
    setNavigationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navigationOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setNavigationOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [navigationOpen]);
  useEffect(() => {
    const lockTargets = [
      ".navigation-open",
      ".team-management-mobile-open",
      ".profile-modal",
      ".password-modal",
      ".confirmation-modal",
      ".cancellation-modal",
      ".lgpd-modal",
      ".notification-consent-modal",
      ".system-tutorial-modal",
    ].join(",");
    const mobileQuery = window.matchMedia("(max-width: 1100px)");
    let locked = false;
    let scrollPosition = 0;

    function lockPage() {
      if (locked) return;
      locked = true;
      scrollPosition = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.right = "0";
      document.body.style.left = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.classList.add("mobile-overlay-open");
    }

    function unlockPage() {
      if (!locked) return;
      locked = false;
      document.body.classList.remove("mobile-overlay-open");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.right = "";
      document.body.style.left = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollPosition);
    }

    function syncPageLock() {
      const shouldLock = mobileQuery.matches && Boolean(document.querySelector(lockTargets));
      if (shouldLock) lockPage();
      else unlockPage();
    }

    const observer = new MutationObserver(syncPageLock);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    mobileQuery.addEventListener("change", syncPageLock);
    syncPageLock();

    return () => {
      observer.disconnect();
      mobileQuery.removeEventListener("change", syncPageLock);
      unlockPage();
    };
  }, []);

  useEffect(() => {
    if (tutorialReady && loadAuthSession()?.tutorialCompleted === false) {
      setTutorialOpen(true);
    }
  }, [tutorialReady]);

  useEffect(() => {
    if (!location.state?.toast) return undefined;
    setToast(location.state.toast);
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
    return undefined;
  }, [location.pathname, location.search, location.state?.toast, navigate]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  async function closeTutorial() {
    if (completingTutorial) return;

    if (loadAuthSession()?.tutorialCompleted !== false) {
      setTutorialOpen(false);
      return;
    }

    setCompletingTutorial(true);
    try {
      await completeTutorial();
      updateTutorialCompleted(true);
      setTutorialOpen(false);
    } catch (error) {
      setToast(
        error?.message ||
          "Não foi possível concluir o tutorial. Tente novamente.",
      );
    } finally {
      setCompletingTutorial(false);
    }
  }

  return (
    <div className="app">
      <header>
        <Link className="brand" to={location.pathname}>
          <span className="brand-mark">
            <img src="/favicon.png" alt="" />
          </span>
          <span>
            Click <i>Fila</i>
          </span>
        </Link>
        <button
          className="mobile-navigation-trigger"
          type="button"
          aria-label={navigationOpen ? "Fechar menu" : "Abrir menu"}
          aria-controls="session-navigation"
          aria-expanded={navigationOpen}
          onClick={() => setNavigationOpen((open) => !open)}
        >
          {navigationOpen ? <X size={22} /> : <Menu size={22} />}
          <span>{navigationOpen ? "Fechar" : "Menu"}</span>
        </button>
        <div
          id="session-navigation"
          className={`dashboard-navigation-list${navigationOpen ? " navigation-open" : ""}`}
          role="navigation"
          aria-label="Navegação da conta"
        >
          {tutorialReady && (
            <button className="account-action" type="button" onClick={() => { setNavigationOpen(false); setTutorialOpen(true); }}>
              <CircleHelp size={16} /> <span>Como funciona</span>
            </button>
          )}
          {sessionRole === "PROFESSIONAL" && (
            <button
              className="account-action"
              type="button"
              onClick={() => {
                setNavigationOpen(false);
                navigate(
                  location.pathname === "/clientQueue"
                    ? "/professionalDashboard"
                    : "/clientQueue",
                );
              }}
            >
              {location.pathname === "/clientQueue" ? (
                <LayoutDashboard size={16} />
              ) : (
                <ListPlus size={16} />
              )}
              <span>
                {location.pathname === "/clientQueue"
                  ? "Painel profissional"
                  : "Entrar em uma fila"}
              </span>
            </button>
          )}
          {showInvites && (
            <button
              className="account-action invites-header-action"
              type="button"
              onClick={() => { setNavigationOpen(false); onOpenInvites?.(); }}
            >
              <Mail size={16} /> <span>Meus convites</span>
              {pendingInviteCount > 0 && (
                <b className="header-invite-count">{pendingInviteCount}</b>
              )}
            </button>
          )}
          <button
            className="account-action"
            type="button"
            onClick={() => { setNavigationOpen(false); setProfileOpen(true); }}
          >
            <UserRound size={16} /> <span>Meu perfil</span>
          </button>
          <button
            className="logout"
            type="button"
            onClick={() => { setNavigationOpen(false); setConfirmLogout(true); }}
          >
            <LogOut size={16} /> <span>Sair</span>
          </button>
        </div>
      </header>
      {profileOpen && (
        <ProfileSettingsContent onClose={() => setProfileOpen(false)} />
      )}
      {tutorialOpen && (
        <SystemTutorialModal
          role={tutorialRole}
          onClose={closeTutorial}
          isCompleting={completingTutorial}
        />
      )}
      {confirmLogout && (
        <ConfirmationModal
          confirmation={{
            title: "Sair da conta",
            message: "Deseja realmente encerrar sua sessão?",
            confirmLabel: "Sim, sair",
            danger: true,
          }}
          onBack={() => setConfirmLogout(false)}
          onConfirm={handleLogout}
        />
      )}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
      {children}
      <SiteFooter />
    </div>
  );
}
