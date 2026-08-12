import React from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

/**
 * Campo de senha compartilhado pelo login e pelo cadastro.
 * O conteúdo de labelAction permite incluir ações como "Esqueceu a senha?".
 */
export default function PasswordField({
  label,
  labelAction,
  value,
  onChange,
  visible,
  setVisible,
  placeholder,
  visibilityLabel,
  ...inputProps
}) {
  return (
    <label className={labelAction ? "password-label" : undefined}>
      {labelAction ? <span>{label}</span> : label}
      {labelAction}
      <div className="input-wrap password-wrap">
        <LockKeyhole size={17} />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...inputProps}
        />
        <button
          type="button"
          aria-label={
            visible
              ? `Ocultar ${visibilityLabel}`
              : `Mostrar ${visibilityLabel}`
          }
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}
