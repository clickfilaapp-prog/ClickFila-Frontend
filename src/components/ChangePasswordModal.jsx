import React, { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { changeMyPassword } from "../services/profile";
import PasswordField from "./PasswordField";
import ConfirmationModal from "./professionalDashboard/ConfirmationModal";

const EMPTY_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [visible, setVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function updateField(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setError("");
      setSuccess("");
    };
  }

  function validate() {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword)
      return "Preencha todos os campos.";
    if (form.newPassword.length < 6)
      return "A nova senha deve ter no mínimo 6 caracteres.";
    if (form.newPassword !== form.confirmPassword)
      return "A confirmação deve ser igual à nova senha.";
    if (form.currentPassword === form.newPassword)
      return "A nova senha deve ser diferente da senha atual.";
    return "";
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setConfirming(true);
  }

  async function confirmPasswordChange() {
    setLoading(true);
    setError("");
    try {
      await changeMyPassword(form);
      setForm(EMPTY_FORM);
      setConfirming(false);
      setSuccess("Senha alterada com sucesso.");
    } catch (requestError) {
      setConfirming(false);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="password-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-modal-title"
    >
      {confirming && (
        <ConfirmationModal
          confirmation={{
            title: "Alterar senha",
            message: "Deseja confirmar a alteração da sua senha de acesso?",
            confirmLabel: "Sim, alterar",
          }}
          loading={loading}
          onBack={() => setConfirming(false)}
          onConfirm={confirmPasswordChange}
        />
      )}
      <section>
        <button
          className="password-modal-close"
          type="button"
          aria-label="Fechar"
          onClick={onClose}
        >
          <X size={19} />
        </button>
        <div className="password-modal-icon">
          <KeyRound size={22} />
        </div>
        <h2 id="password-modal-title">Alterar senha</h2>
        <p>
          Confirme sua senha atual e escolha uma nova senha com pelo menos 6
          caracteres.
        </p>
        <form className="password-modal-form" onSubmit={handleSubmit}>
          <PasswordField
            label="Senha atual"
            value={form.currentPassword}
            onChange={updateField("currentPassword")}
            visible={visible.current}
            setVisible={(value) =>
              setVisible((current) => ({
                ...current,
                current:
                  typeof value === "function" ? value(current.current) : value,
              }))
            }
            visibilityLabel="senha atual"
            autoComplete="current-password"
            disabled={loading}
          />
          <PasswordField
            label="Nova senha"
            value={form.newPassword}
            onChange={updateField("newPassword")}
            visible={visible.next}
            setVisible={(value) =>
              setVisible((current) => ({
                ...current,
                next: typeof value === "function" ? value(current.next) : value,
              }))
            }
            visibilityLabel="nova senha"
            autoComplete="new-password"
            minLength={6}
            disabled={loading}
          />
          <PasswordField
            label="Confirmar nova senha"
            value={form.confirmPassword}
            onChange={updateField("confirmPassword")}
            visible={visible.confirm}
            setVisible={(value) =>
              setVisible((current) => ({
                ...current,
                confirm:
                  typeof value === "function" ? value(current.confirm) : value,
              }))
            }
            visibilityLabel="confirmação da senha"
            autoComplete="new-password"
            minLength={6}
            disabled={loading}
          />
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
          <div className="password-modal-actions">
            <button
              type="button"
              className="confirmation-back"
              disabled={loading}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="confirmation-accept"
              disabled={loading}
            >
              {loading ? "Alterando..." : "Alterar senha"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
