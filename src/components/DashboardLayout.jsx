import React, { useState } from "react";
import { LogOut, Scissors, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession } from "../auth/authStorage";
import { ProfileSettingsContent } from "../pages/ProfileSettings";
import ConfirmationModal from "./professionalDashboard/ConfirmationModal";

/** Estrutura reutilizada somente pelas áreas autenticadas. */
export default function DashboardLayout({ children }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
      {children}
      <footer>
        <span>Click Fila 2026</span>
        <span>Sistema de fila com acesso por perfil.</span>
      </footer>
    </div>
  );
}
