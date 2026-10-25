import React, { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
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
  downgradeToClient,
  getMyUserProfile,
  upgradeMyRole,
  updateMyUserProfile,
} from "../services/profile";
import { refreshAuthSession } from "../services/api";
import { clearProfessionalDashboardCache } from "../services/queue";

const EMPTY_FORM = { name: "", phone: "", login: "" };

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
  const [confirmingEdit, setConfirmingEdit] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingUpgrade, setConfirmingUpgrade] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [confirmingDowngrade, setConfirmingDowngrade] = useState(false);
  const [downgrading, setDowngrading] = useState(false);

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

  async function confirmRoleDowngrade() {
    setDowngrading(true);
    setError("");
    try {
      const updatedProfile = await downgradeToClient();
      const updatedRole = String(updatedProfile?.role)
        .replace(/^ROLE_/i, "")
        .toUpperCase();
      if (updatedRole !== "USER") {
        throw new Error("O servidor não confirmou a alteração para cliente.");
      }

      // O JWT atual ainda possui a role PROFESSIONAL. Remova-o antes do
      // refresh para impedir que a permissão antiga seja reutilizada.
      removeAccessToken();
      await refreshAuthSession();
      updateAuthRole("USER");
      updateTutorialCompleted(updatedProfile?.tutorialCompleted === true);
      clearProfessionalDashboardCache();

      // A troca de rota desmonta o dashboard e descarta seu estado em memória.
      navigate("/clientQueue", {
        replace: true,
        state: { toast: "Sua conta agora está no perfil de cliente." },
      });
    } catch (requestError) {
      setConfirmingDowngrade(false);
      setError(requestError.message);
    } finally {
      setDowngrading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const profile = await getMyUserProfile();
        if (!active) return;
        const user = profile;
        const login = user?.login || "";
        const loadedName =
          user?.name || user?.fullName || user?.displayName || "";
        const loadedForm = {
          name: loadedName,
          phone: formatPhone(user?.phone),
          login,
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

  async function handleSubmit(event) {
    event.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.replace(/\D/g, "");
    const initialPhone = initialForm.phone.replace(/\D/g, "");
    const userPayload = {};

    if (name !== initialForm.name.trim()) userPayload.name = name;
    if (phone !== initialPhone) userPayload.phone = phone;
    if (
      userPayload.name !== undefined &&
      (name.length < 3 || name.length > 50)
    ) {
      setError("O nome deve ter entre 3 e 50 caracteres.");
      return;
    }
    if (
      userPayload.phone !== undefined &&
      (phone.length > 20 || !/^\d{10,11}$/.test(phone))
    ) {
      setError("Informe um telefone com DDD e 10 ou 11 dígitos.");
      return;
    }
    if (!Object.keys(userPayload).length) {
      setSuccess("Nenhuma alteração para salvar.");
      return;
    }

    const changes = { name, phone, userPayload };
    if (!window.matchMedia("(max-width: 760px)").matches) {
      setPendingChanges(changes);
      return;
    }

    await saveProfileChanges(changes);
  }

  async function saveProfileChanges({ name, phone, userPayload }) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updatedUser = await updateMyUserProfile(userPayload);
      const nextForm = {
        ...form,
        name: updatedUser?.name || name,
        phone: formatPhone(updatedUser?.phone || phone),
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
          onConfirm={() => saveProfileChanges(pendingChanges)}
        />
      )}
      {confirmingEdit && (
        <ConfirmationModal
          confirmation={{
            title: "Alterar dados pessoais",
            message: "Deseja liberar os campos nome e telefone para alteração?",
            confirmLabel: "Sim, alterar",
          }}
          onBack={() => setConfirmingEdit(false)}
          onConfirm={() => {
            setConfirmingEdit(false);
            setEditing(true);
            setError("");
            setSuccess("");
          }}
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
      {confirmingDowngrade && (
        <ConfirmationModal
          confirmation={{
            title: "Mudar para cliente",
            message:
              "Você deixará de acessar o painel profissional. Se for dono, feche a fila antes de continuar; se estiver atendendo, finalize ou cancele o atendimento atual.",
            backLabel: "Não, continuar como profissional",
            confirmLabel: "Sim, mudar para cliente",
          }}
          loading={downgrading}
          onBack={() => setConfirmingDowngrade(false)}
          onConfirm={confirmRoleDowngrade}
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
          </div>
          <p>
            Confira e atualize seus dados pessoais.
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
                      minLength={3}
                      maxLength={50}
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      disabled={saving}
                    />
                  </div>
                ) : (
                  <>
                    <div className="profile-value profile-value-desktop">
                      <UserRound size={17} />
                      <span>{form.name || "Nome não informado"}</span>
                      <button
                        className="profile-field-edit"
                        type="button"
                        onClick={() => {
                          setEditing(true);
                          setError("");
                          setSuccess("");
                        }}
                        aria-label="Editar nome"
                        title="Editar nome"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                    <button
                      className="profile-value profile-value-action"
                      type="button"
                      onClick={() => setConfirmingEdit(true)}
                      aria-label="Alterar nome"
                    >
                      <UserRound size={17} />
                      <span>{form.name || "Nome não informado"}</span>
                      <Pencil className="profile-mobile-edit-icon" size={15} />
                    </button>
                  </>
                )}
              </label>
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
                  <>
                    <div className="profile-value profile-value-desktop">
                      <Phone size={17} />
                      <span>{form.phone || "Telefone não informado"}</span>
                      <button
                        className="profile-field-edit"
                        type="button"
                        onClick={() => {
                          setEditing(true);
                          setError("");
                          setSuccess("");
                        }}
                        aria-label="Editar telefone"
                        title="Editar telefone"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                    <button
                      className="profile-value profile-value-action"
                      type="button"
                      onClick={() => setConfirmingEdit(true)}
                      aria-label="Alterar telefone"
                    >
                      <Phone size={17} />
                      <span>{form.phone || "Telefone não informado"}</span>
                      <Pencil className="profile-mobile-edit-icon" size={15} />
                    </button>
                  </>
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
                  {saving ? (
                    "Salvando..."
                  ) : (
                    <>
                      <span className="profile-submit-desktop">Salvar alterações</span>
                      <span className="profile-submit-mobile">Atualizar dados</span>
                    </>
                  )}
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
              {isProfessional && (
                <button
                  className="profile-password-button"
                  type="button"
                  disabled={saving || downgrading}
                  onClick={() => setConfirmingDowngrade(true)}
                >
                  <UserRound size={17} /> Quero ser cliente
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
