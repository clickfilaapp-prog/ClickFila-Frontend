import React, { useEffect, useState } from "react";
import {
  Building2,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { loadAuthSession } from "../auth/authStorage";
import DashboardLayout from "../components/DashboardLayout";
import ChangePasswordModal from "../components/ChangePasswordModal";
import ConfirmationModal from "../components/professionalDashboard/ConfirmationModal";
import {
  getMyProfessionalProfile,
  getMyUserProfile,
  updateMyProfessionalProfile,
  updateMyUserProfile,
} from "../services/profile";

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

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const profile = isProfessional
          ? await getMyProfessionalProfile()
          : await getMyUserProfile();
        if (!active) return;
        const user = isProfessional ? profile?.user : profile;
        const login = user?.login || "";
        const loadedName =
          user?.name || user?.fullName || user?.displayName || "";
        const loadedForm = {
          name: loadedName,
          phone: formatPhone(user?.phone),
          login,
          businessName: profile?.businessName || "",
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
    const professionalPayload = {};

    if (name !== initialForm.name.trim()) userPayload.name = name;
    if (phone !== initialPhone) userPayload.phone = phone;
    if (isProfessional && businessName !== initialForm.businessName.trim()) {
      professionalPayload.businessName = businessName;
    }
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
      professionalPayload.businessName !== undefined &&
      (businessName.length < 2 || businessName.length > 150)
    ) {
      setError("O nome do negócio deve ter entre 2 e 150 caracteres.");
      return;
    }

    if (
      !Object.keys(userPayload).length &&
      !Object.keys(professionalPayload).length
    ) {
      setSuccess("Nenhuma alteração para salvar.");
      return;
    }

    setPendingChanges({
      name,
      phone,
      businessName,
      userPayload,
      professionalPayload,
    });
  }

  async function confirmProfileUpdate() {
    if (!pendingChanges) return;
    const { name, phone, businessName, userPayload, professionalPayload } =
      pendingChanges;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const [updatedUser, updatedProfessional] = await Promise.all([
        Object.keys(userPayload).length
          ? updateMyUserProfile(userPayload)
          : null,
        Object.keys(professionalPayload).length
          ? updateMyProfessionalProfile(professionalPayload)
          : null,
      ]);
      const nextForm = {
        ...form,
        name: updatedUser?.name || name,
        phone: formatPhone(updatedUser?.phone || phone),
        businessName: updatedProfessional?.businessName || businessName,
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
            Confira e atualize seus dados pessoais
            {isProfessional ? " e os dados da barbearia" : ""}.
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
                        autoComplete="off"
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
