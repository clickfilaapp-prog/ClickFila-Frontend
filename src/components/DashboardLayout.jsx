import React, { useEffect, useState } from "react";
import { LogOut, Mail, Scissors, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession } from "../auth/authStorage";
import { ProfileSettingsContent } from "../pages/ProfileSettings";
import ConfirmationModal from "./professionalDashboard/ConfirmationModal";
import SiteFooter from "./SiteFooter";

/** Estrutura reutilizada somente pelas áreas autenticadas. */
export default function DashboardLayout({
  children,
  showInvites = false,
  pendingInviteCount = 0,
  onOpenInvites,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState(location.state?.toast || "");

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

  return (
    <div className="app">
      <header>
        <Link className="brand" to={location.pathname}>
          <span className="brand-mark">
            <Scissors size={21} />
          </span>
          <span>
            Click <i>Fila</i>
          </span>
        </Link>
        <div className="session-bar">
          {showInvites && (
            <button
              className="account-action invites-header-action"
              type="button"
              onClick={onOpenInvites}
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
            onClick={() => setProfileOpen(true)}
          >
            <UserRound size={16} /> <span>Meu perfil</span>
          </button>
          <button
            className="logout"
            type="button"
            onClick={() => setConfirmLogout(true)}
          >
            <LogOut size={16} /> <span>Sair</span>
          </button>
        </div>
      </header>
      {profileOpen && (
        <ProfileSettingsContent onClose={() => setProfileOpen(false)} />
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
