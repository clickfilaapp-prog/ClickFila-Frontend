import React, { useEffect, useState } from "react";
import {
  CircleHelp,
  CreditCard,
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
import { acceptTeamInvite, declineTeamInvite, getMyTeamInvites, leaveTeam } from "../services/team";
import { deactivateBusiness, getProfessionalDashboard } from "../services/queue";
import { ProfileSettingsContent } from "../pages/ProfileSettings";
import ConfirmationModal from "./professionalDashboard/ConfirmationModal";
import PendingInvites from "./professionalDashboard/PendingInvites";
import EmailVerificationNotice from "./EmailVerificationNotice";
import SiteFooter from "./SiteFooter";
import SystemTutorialModal from "./SystemTutorialModal";

/** Estrutura reutilizada somente pelas áreas autenticadas. */
export default function DashboardLayout({
  children,
  showInvites = false,
  pendingInviteCount = 0,
  pendingInvites = [],
  onOpenInvites = null,
  tutorialReady = true,
  emailVerified = null,
  onEmailVerified = null,
  emailVerificationInline = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionRole = loadAuthSession()?.role || "USER";
  const dashboardPath =
    sessionRole === "PROFESSIONAL" ? "/professionalDashboard" : "/clientQueue";
  const emailVerificationRequired = emailVerified === false;
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
  const [globalInvites, setGlobalInvites] = useState([]);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesError, setInvitesError] = useState("");
  const [blockedInvite, setBlockedInvite] = useState(null);

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
      ".email-verification-modal",
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

  async function loadGlobalInvites({ open = false } = {}) {
    if (sessionRole !== "PROFESSIONAL") return;
    if (open) setInvitesOpen(true);
    if (showInvites) {
      setGlobalInvites(Array.isArray(pendingInvites) ? pendingInvites : []);
      return;
    }
    setInvitesLoading(true);
    setInvitesError("");
    try {
      const invites = await getMyTeamInvites();
      setGlobalInvites(Array.isArray(invites) ? invites : []);
    } catch (error) {
      setInvitesError(error.message);
    } finally {
      setInvitesLoading(false);
    }
  }

  useEffect(() => {
    if (sessionRole === "PROFESSIONAL" && !showInvites) loadGlobalInvites();
  }, [sessionRole, showInvites]);

  useEffect(() => {
    if (showInvites) {
      setGlobalInvites(Array.isArray(pendingInvites) ? pendingInvites : []);
    }
  }, [showInvites, pendingInvites]);

  async function handleGlobalAccept(invite) {
    setInvitesLoading(true);
    setInvitesError("");
    try {
      await acceptTeamInvite(invite.id);
      window.location.assign("/professionalDashboard");
    } catch (error) {
      if (error.status === 409 && error.code === "ALREADY_IN_TEAM") {
        try {
          const dashboard = await getProfessionalDashboard({ force: true });
          setBlockedInvite({ invite, role: dashboard?.loggedMemberRole });
        } catch (dashboardError) {
          setInvitesError(dashboardError.message);
        }
      } else {
        setInvitesError(error.message);
      }
    } finally {
      setInvitesLoading(false);
    }
  }

  async function handleGlobalDecline(invite) {
    setInvitesLoading(true);
    setInvitesError("");
    try {
      await declineTeamInvite(invite.id);
      setGlobalInvites((current) => current.filter((item) => item.id !== invite.id));
      setToast("Convite recusado.");
    } catch (error) {
      setInvitesError(error.message);
    } finally {
      setInvitesLoading(false);
    }
  }

  async function handleReplaceTeam() {
    setInvitesLoading(true);
    setInvitesError("");
    try {
      if (blockedInvite.role === "OWNER") await deactivateBusiness();
      else await leaveTeam();
      await acceptTeamInvite(blockedInvite.invite.id);
      window.location.assign("/professionalDashboard");
    } catch (error) {
      setInvitesError(error.message);
      setBlockedInvite(null);
    } finally {
      setInvitesLoading(false);
    }
  }
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
        <Link className="brand" to={dashboardPath} aria-label="Ir para o painel principal">
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
          {sessionRole === "PROFESSIONAL" && location.pathname !== "/professionalDashboard" && (
            <button className="account-action" type="button" onClick={() => { setNavigationOpen(false); navigate("/professionalDashboard"); }}>
              <LayoutDashboard size={16} /> <span>Painel profissional</span>
            </button>
          )}
          {sessionRole === "PROFESSIONAL" && location.pathname !== "/clientQueue" && (
            <button className="account-action" type="button" onClick={() => { setNavigationOpen(false); navigate("/clientQueue"); }}>
              <ListPlus size={16} /> <span>Entrar em uma fila</span>
            </button>
          )}
          {sessionRole === "PROFESSIONAL" && (
            <button
              className="account-action invites-header-action"
              type="button"
              onClick={() => { setNavigationOpen(false); loadGlobalInvites({ open: true }); }}
            >
              <Mail size={16} /> <span>Meus convites</span>
              {globalInvites.length > 0 && (
                <b className="header-invite-count">{globalInvites.length}</b>
              )}
            </button>
          )}
          {sessionRole === "PROFESSIONAL" && (
            <button className="account-action" type="button" onClick={() => { setNavigationOpen(false); navigate("/billing"); }}>
              <CreditCard size={16} /> <span>Minha empresa</span>
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
      {emailVerificationRequired && (
        <EmailVerificationNotice
          onVerified={onEmailVerified}
          inline
        />
      )}
      {invitesOpen && (
        <div className="confirmation-modal invites-list-modal" role="dialog" aria-modal="true" aria-labelledby="global-invites-title">
          <div>
            <button className="member-modal-close" type="button" disabled={invitesLoading} onClick={() => setInvitesOpen(false)} aria-label="Fechar convites"><X size={20} /></button>
            <div className="invite-alert-icon"><Mail size={26} /></div>
            <span className="step">EQUIPE</span>
            <h2 id="global-invites-title">Meus convites</h2>
            <p>Convites pendentes enviados para sua conta.</p>
            {invitesError && <div className="login-auth-error" role="alert">{invitesError}</div>}
            {invitesLoading && !globalInvites.length ? <p>Carregando convites...</p> : globalInvites.length ? (
              <PendingInvites invites={globalInvites} loading={invitesLoading} onAccept={handleGlobalAccept} onDecline={handleGlobalDecline} />
            ) : (
              <div className="invites-empty"><Mail size={28} /><strong>Nenhum convite pendente</strong><span>Quando uma barbearia convidar você, ele aparecerá aqui.</span></div>
            )}
          </div>
        </div>
      )}
      {blockedInvite && (
        <ConfirmationModal
          confirmation={{ title: "Vínculo Ativo Encontrado", message: "Você já está vinculado a uma barbearia. Para aceitar este novo convite, você precisa encerrar seu vínculo atual.", confirmLabel: blockedInvite.role === "OWNER" ? "Desativar minha barbearia" : "Sair da equipe atual", backLabel: "Cancelar", danger: true }}
          loading={invitesLoading}
          onBack={() => setBlockedInvite(null)}
          onConfirm={handleReplaceTeam}
        />
      )}      {profileOpen && (
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
      {!emailVerificationRequired && children}
      <SiteFooter />
    </div>
  );
}
