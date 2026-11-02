import React, { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, Send, X } from "lucide-react";
import { getMyUserProfile } from "../services/profile";

const SUBJECT_OPTIONS = [
  "Acesso à conta ou cadastro",
  "Fila e entrada de clientes",
  "Chamada ou atendimento",
  "Equipe e convites",
  "Empresa e configurações",
  "Plano, cobrança ou pagamento",
  "Notificações",
  "Erro ou problema técnico",
  "Sugestão de melhoria",
  "Outro assunto",
];

const EMPTY_FORM = {
  name: "",
  email: "",
  company: "",
  phone: "",
  subject: "",
  message: "",
};

export default function SupportWidget({ businessName = "" }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    company: businessName,
  }));
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (businessName) {
      setForm((current) => ({
        ...current,
        company: current.company || businessName,
      }));
    }
  }, [businessName]);

  useEffect(() => {
    if (!open || profileLoaded) return undefined;
    let active = true;

    getMyUserProfile()
      .then((profile) => {
        if (!active) return;
        setForm((current) => ({
          ...current,
          name:
            current.name ||
            profile?.name ||
            profile?.fullName ||
            profile?.displayName ||
            "",
          email: current.email || profile?.email || profile?.login || "",
          phone: current.phone || profile?.phone || "",
        }));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setProfileLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [open, profileLoaded]);

  useEffect(() => {
    if (!open) return undefined;
    closeButtonRef.current?.focus();

    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError("");
    if (success) setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.subject) {
      setError("Selecione o assunto do atendimento.");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");
    try {
      const supportResponse = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await supportResponse.json().catch(() => ({}));
      if (!supportResponse.ok) {
        throw new Error(result.message || "Não foi possível enviar sua mensagem.");
      }

      setSuccess("Mensagem enviada! Nossa equipe entrará em contato em breve.");
      setForm((current) => ({
        ...current,
        subject: "",
        message: "",
      }));
    } catch (requestError) {
      setError(requestError.message || "Não foi possível enviar sua mensagem.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`support-widget${open ? " is-open" : ""}`}>
      {open && (
        <section
          className="support-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="support-panel-title"
        >
          <div className="support-panel-header">
            <div>
              <span>SUPORTE CLICK FILA</span>
              <h2 id="support-panel-title">Como podemos ajudar?</h2>
            </div>
            <button
              ref={closeButtonRef}
              className="support-panel-close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar suporte"
            >
              <X size={21} />
            </button>
          </div>

          <form className="support-form" onSubmit={handleSubmit}>
            <input
              className="support-honeypot"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <div className="support-form-row">
              <label>
                Nome
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Como podemos chamar você?"
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="voce@empresa.com.br"
                  autoComplete="email"
                  required
                />
              </label>
            </div>
            <div className="support-form-row">
              <label>
                Nome da empresa
                <input
                  name="company"
                  value={form.company}
                  onChange={updateField}
                  placeholder="Nome da sua empresa"
                  autoComplete="organization"
                />
              </label>
              <label>
                Telefone
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                />
              </label>
            </div>

            <label>
              Assunto
              <select
                name="subject"
                value={form.subject}
                onChange={updateField}
                required
              >
                <option value="" disabled>
                  Selecione uma opção
                </option>
                {SUBJECT_OPTIONS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Mensagem
              <textarea
                name="message"
                value={form.message}
                onChange={updateField}
                placeholder="Conte como podemos ajudar."
                maxLength={300}
                required
              />
              <span className="support-character-count">
                {form.message.length}/300 caracteres
              </span>
            </label>

            {error && <p className="support-form-error" role="alert">{error}</p>}
            {success && <p className="support-form-success" role="status">{success}</p>}

            <button className="support-submit" type="submit" disabled={sending}>
              {sending ? "Enviando..." : "Enviar mensagem"} <Send size={17} />
            </button>
          </form>
        </section>
      )}

      <button
        className="support-trigger"
        type="button"
        aria-label={open ? "Fechar suporte" : "Abrir suporte"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={25} /> : <MessageCircleQuestion size={27} />}
        <span>{open ? "Fechar" : "Suporte"}</span>
      </button>
    </div>
  );
}
