import React, { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  loadAuthSession,
  removeAccessToken,
  updateAuthRole,
  updateTutorialCompleted,
} from "../auth/authStorage";
import DashboardLayout from "../components/DashboardLayout";
import ChangePasswordModal from "../components/ChangePasswordModal";
import ConfirmationModal from "../components/professionalDashboard/ConfirmationModal";
import {
  deleteMyAccount,
  getMyUserProfile,
  upgradeMyRole,
  updateMyUserProfile,
} from "../services/profile";
import { refreshAuthSession } from "../services/api";
import {
  getProfessionalDashboard,
  updateMyBusiness,
} from "../services/queue";

const EMPTY_FORM = { name: "", phone: "", login: "", businessName: "" };

function formatPhone(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function ProfileSettingsContent({ onClose = null }) {
  const navigate = useNavigate();
  const isProfessional = loadAuthSession()?.role === "PROFESSIONAL";
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingChanges, setPendingChanges] = useState(null);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingUpgrade, setConfirmingUpgrade] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(""), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  async function confirmAccountDeletion() {
    setDeleting(true);
    setError("");
    try {
      await deleteMyAccount();
      clearAuthSession();
      navigate("/login", {
        replace: true,
        state: { message: "Sua conta foi desativada e será excluída em 30 dias." },
      });
    } catch (requestError) {
      setConfirmingDeletion(false);
      setError(requestError.message);
      setDeleting(false);
    }
  }

  async function confirmRoleUpgrade() {
    setUpgrading(true);
    setError("");
    try {
      const updatedProfile = await upgradeMyRole();
      const updatedRole = String(updatedProfile?.role)
        .replace(/^ROLE_/i, "")
        .toUpperCase();
      if (updatedRole !== "PROFESSIONAL") {
        throw new Error("O servidor não confirmou o upgrade para profissional.");
      }

      removeAccessToken();
      await refreshAuthSession();
      updateAuthRole("PROFESSIONAL");
      updateTutorialCompleted(false);
      navigate("/professionalDashboard", { replace: true });
    } catch (requestError) {
      setConfirmingUpgrade(false);
      setError(requestError.message);
    } finally {
      setUpgrading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const [profile, dashboard] = await Promise.all([
          getMyUserProfile(),
          isProfessional ? getProfessionalDashboard() : null,
        ]);
        if (!active) return;
        const user = profile;
        const login = user?.login || "";
        const loadedName =
          user?.name || user?.fullName || user?.displayName || "";
        const loadedForm = {
          name: loadedName,
          phone: formatPhone(user?.phone),
          login,
          businessName:
            dashboard?.businessName ||
            user?.businessName ||
            user?.business?.name ||
            "",
        };
        setForm(loadedForm);
        setInitialForm(loadedForm);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [isProfessional]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const name = form.name.trim();
    const businessName = form.businessName.trim();
    const phone = form.phone.replace(/\D/g, "");
    const initialPhone = initialForm.phone.replace(/\D/g, "");
    const userPayload = {};
    const businessChanged =
      isProfessional && businessName !== initialForm.businessName.trim();

    if (name !== initialForm.name.trim()) userPayload.name = name;
    if (phone !== initialPhone) userPayload.phone = phone;
    if (
      userPayload.name !== undefined &&
      (name.length < 2 || name.length > 100)
    ) {
      setError("O nome deve ter entre 2 e 100 caracteres.");
      return;
    }
    if (
      userPayload.phone !== undefined &&
      (phone.length > 20 || !/^\d{10,11}$/.test(phone))
    ) {
      setError("Informe um telefone com DDD e 10 ou 11 dígitos.");
      return;
    }
    if (
      businessChanged &&
      (businessName.length < 2 || businessName.length > 150)
    ) {
      setError("O nome do negócio deve ter entre 2 e 150 caracteres.");
      return;
    }
    if (!Object.keys(userPayload).length && !businessChanged) {
      setSuccess("Nenhuma alteração para salvar.");
      return;
    }

    setPendingChanges({
      name,
      phone,
      businessName,
      userPayload,
      businessChanged,
    });
  }

  async function confirmProfileUpdate() {
    if (!pendingChanges) return;
    const { name, phone, businessName, userPayload, businessChanged } = pendingChanges;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const [updatedUser, updatedBusiness] = await Promise.all([
        Object.keys(userPayload).length ? updateMyUserProfile(userPayload) : null,
        businessChanged ? updateMyBusiness(businessName) : null,
      ]);
      const nextForm = {
        ...form,
        name: updatedUser?.name || name,
        phone: formatPhone(updatedUser?.phone || phone),
        businessName: updatedBusiness?.name || businessName,
      };
      setForm(nextForm);
      setInitialForm(nextForm);
      window.dispatchEvent(
        new CustomEvent("barberflow:profile-updated", { detail: nextForm }),
      );
      setEditing(false);
      setPendingChanges(null);
      setSuccess("Perfil atualizado com sucesso.");
    } catch (requestError) {
      setPendingChanges(null);
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const content = (
    <>
      {changingPassword && (
        <ChangePasswordModal onClose={() => setChangingPassword(false)} />
      )}
      {pendingChanges && (
        <ConfirmationModal
          confirmation={{
            title: "Salvar alterações",
            message: "Deseja confirmar as alterações feitas nos seus dados?",
            confirmLabel: "Sim, salvar",
          }}
          loading={saving}
          onBack={() => setPendingChanges(null)}
          onConfirm={confirmProfileUpdate}
        />
      )}
      {confirmingDeletion && (
        <ConfirmationModal
          confirmation={{
            title: "Excluir conta",
            message:
              "Sua conta será desativada. Você terá até 30 dias após esta " +
              "solicitação para recuperá-la fazendo login e escolhendo " +
              "reativar. Depois desse prazo, a recuperação não estará mais " +
              "disponível. Deseja continuar?",
            backLabel: "Cancelar",
            confirmLabel: "Sim, excluir",
            danger: true,
          }}
          loading={deleting}
          onBack={() => setConfirmingDeletion(false)}
          onConfirm={confirmAccountDeletion}
        />
      )}
      {confirmingUpgrade && (
        <ConfirmationModal
          confirmation={{
            title: "Tornar-se profissional",
            message:
              "Ao continuar, sua conta será alterada para profissional e, no próximo acesso, você deverá cadastrar o nome do negócio. Deseja realmente continuar?",
            backLabel: "Não, continuar como cliente",
            confirmLabel: "Sim, tornar-me profissional",
            danger: true,
          }}
          loading={upgrading}
          onBack={() => setConfirmingUpgrade(false)}
          onConfirm={confirmRoleUpgrade}
        />
      )}
      <main className="profile-main">
        <section className="profile-card">
          {onClose && (
            <button
              className="profile-modal-close"
              type="button"
              aria-label="Fechar perfil"
              onClick={onClose}
            >
              <X size={19} />
            </button>
          )}
          <div className="profile-heading">
            <div>
              <span className="step">CONFIGURAÇÕES DE PERFIL</span>
              <h1>Dados pessoais</h1>
            </div>
            <button
              className="profile-edit-button"
              type="button"
              onClick={() => {
                if (editing) setForm(initialForm);
                setEditing((current) => !current);
                setError("");
                setSuccess("");
              }}
              disabled={loading || saving}
            >
              {editing ? <X size={17} /> : <Pencil size={17} />}
              {editing ? "Cancelar" : "Editar"}
            </button>
          </div>
          <p>
            Confira e atualize seus dados pessoais e o nome do seu negócio.
          </p>
          {loading ? (
            <div className="profile-loading" role="status">
              Carregando seus dados...
            </div>
          ) : (
            <form
              className="profile-form"
              onSubmit={handleSubmit}
              autoComplete="off"
            >
              {error && (
                <div className="login-auth-error" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="login-auth-success" role="status">
                  {success}
                </div>
              )}
              <label>
                Nome
                {editing ? (
                  <div className="input-wrap">
                    <UserRound size={17} />
                    <input
                      name="profile-name"
                      autoComplete="off"
                      required
                      minLength={2}
                      maxLength={100}
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <div className="profile-value">
                    <UserRound size={17} />
                    <span>{form.name || "Nome não informado"}</span>
                  </div>
                )}
              </label>
              {isProfessional && (
                <label>
                  Nome do negócio
                  {editing ? (
                    <div className="input-wrap">
                      <Building2 size={17} />
                      <input
                        name="profile-business-name"
                        required
                        minLength={2}
                        maxLength={150}
                        value={form.businessName}
                        onChange={(event) =>
                          updateField("businessName", event.target.value)
                        }
                        disabled={saving}
                      />
                    </div>
                  ) : (
                    <div className="profile-value">
                      <Building2 size={17} />
                      <span>{form.businessName || "Nome não informado"}</span>
                    </div>
                  )}
                </label>
              )}
              <label>
                Telefone
                {editing ? (
                  <div className="input-wrap">
                    <Phone size={17} />
                    <input
                      name="profile-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="off"
                      required
                      maxLength={20}
                      value={form.phone}
                      onChange={(event) =>
                        updateField("phone", formatPhone(event.target.value))
                      }
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <div className="profile-value">
                    <Phone size={17} />
                    <span>{form.phone || "Telefone não informado"}</span>
                  </div>
                )}
              </label>
              <label>
                E-mail
                <div className="profile-value">
                  <Mail size={17} />
                  <span>{form.login}</span>
                </div>
                <small>
                  O e-mail de acesso não pode ser alterado nesta tela.
                </small>
              </label>
              {editing && (
                <button
                  className="login-auth-submit"
                  type="submit"
                  disabled={saving}
                >
                  <Save size={17} />{" "}
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              )}
              <button
                className="profile-password-button"
                type="button"
                disabled={saving}
                onClick={() => setChangingPassword(true)}
              >
                <KeyRound size={17} /> Alterar senha
              </button>
              {!isProfessional && (
                <button
                  className="profile-password-button"
                  type="button"
                  disabled={saving || upgrading}
                  onClick={() => setConfirmingUpgrade(true)}
                >
                  <BriefcaseBusiness size={17} /> Quero ser profissional
                </button>
              )}
              <button
                className="profile-delete-button"
                type="button"
                disabled={saving || deleting}
                onClick={() => setConfirmingDeletion(true)}
              >
                <Trash2 size={17} /> Excluir minha conta
              </button>
            </form>
          )}
        </section>
      </main>
    </>
  );

  return onClose ? (
    <div
      className="profile-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Meu perfil"
    >
      {content}
    </div>
  ) : (
    content
  );
}

export default function ProfileSettings() {
  return (
    <DashboardLayout>
      <ProfileSettingsContent />
    </DashboardLayout>
  );
}
