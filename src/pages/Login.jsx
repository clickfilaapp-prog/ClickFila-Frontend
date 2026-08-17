import React, { useState } from "react";
import { LogIn, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import salonHero from "../assets/salao-feminino-masculino.png";
import { saveAuthSession } from "../auth/authStorage";
import PasswordField from "../components/PasswordField";
import PasswordResetFlow from "../components/PasswordResetFlow";
import ConfirmationModal from "../components/professionalDashboard/ConfirmationModal";
import SiteFooter from "../components/SiteFooter";
import { loginUser, reactivateUser } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [recoveringPassword, setRecoveringPassword] = useState(false);
  const [reactivationCredentials, setReactivationCredentials] = useState(null);
  const [isReactivating, setIsReactivating] = useState(false);

  function finishAuthentication(response, message) {
    const role = String(response.role || "")
      .replace(/^ROLE_/i, "")
      .toUpperCase();

    if (!response.token || !role) {
      console.error("A API não retornou o token ou o perfil.", response);
      throw new Error(
        "Ocorreu um problema ao carregar sua conta. Por favor, tente novamente.",
      );
    }

    saveAuthSession(response.token, role);
    navigate(
      role === "PROFESSIONAL" ? "/professionalDashboard" : "/clientQueue",
      {
        replace: true,
        state: message ? { toast: message } : undefined,
      },
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await loginUser(email, password);
      finishAuthentication(response);
    } catch (error) {
      if (error.code === "ACCOUNT_DEACTIVATED") {
        setReactivationCredentials({ email, password });
      } else if (error.status === 401 || error.status === 403) {
        setError("Usuário ou senha inválidos");
      } else {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReactivation() {
    if (!reactivationCredentials) return;
    setIsReactivating(true);
    setError("");
    try {
      const response = await reactivateUser(
        reactivationCredentials.email,
        reactivationCredentials.password,
      );
      setReactivationCredentials(null);
      finishAuthentication(response, "Conta reativada com sucesso!");
    } catch (requestError) {
      setReactivationCredentials(null);
      setError(
        requestError.status === 401 || requestError.status === 403
          ? "Usuário ou senha inválidos"
          : requestError.message,
      );
    } finally {
      setIsReactivating(false);
    }
  }

  function handleGoogleLogin() {
    const apiBaseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:8080"
    ).replace(/\/$/, "");
    window.location.href = `${apiBaseUrl}/api/oauth2/authorization/google`;
  }

  return (
    <div className="auth-page-with-footer">
      <main className="login-auth-main">
      {reactivationCredentials && (
        <ConfirmationModal
          confirmation={{
            title: "Reativar conta",
            message:
              "Sua conta está em processo de exclusão. Deseja cancelar a exclusão e reativar sua conta?",
            backLabel: "Não, manter exclusão",
            confirmLabel: "Sim, reativar",
          }}
          loading={isReactivating}
          onBack={() => setReactivationCredentials(null)}
          onConfirm={handleReactivation}
        />
      )}
      <section className="login-auth-shell">
        <aside className="login-auth-visual">
          <img src={salonHero} alt="Interior de um salão de beleza moderno" />
          <div className="login-auth-overlay" />
          <div className="login-auth-copy">
            <span>SEU MOMENTO DE BRILHAR</span>
            <h1>Cuide do seu tempo e acompanhe seu atendimento.</h1>
            <p>
              Acesse sua conta para entrar na fila e acompanhar cada etapa em
              tempo real.
            </p>
          </div>
        </aside>

        <div className="login-auth-panel">
          {recoveringPassword ? (
            <PasswordResetFlow
              initialEmail={email}
              onBack={() => setRecoveringPassword(false)}
            />
          ) : (
            <>
              <div className="login-auth-heading">
                <h1>Bem-vindo de volta</h1>
                <p>Informe suas credenciais para acessar sua conta.</p>
              </div>

              <form className="login-auth-form" onSubmit={handleSubmit}>
                {(error || location.state?.message) && (
                  <div
                    className={
                      error ? "login-auth-error" : "login-auth-success"
                    }
                    role="status"
                  >
                    {error || location.state.message}
                  </div>
                )}

                <label>
                  E-mail
                  <div className="input-wrap">
                    <Mail size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                </label>

                <PasswordField
                  label="Senha"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  visible={showPassword}
                  setVisible={setShowPassword}
                  placeholder="••••••••"
                  visibilityLabel="senha"
                />

                <button
                  className="forgot-password"
                  type="button"
                  onClick={() => {
                    setError("");
                    setRecoveringPassword(true);
                  }}
                >
                  Esqueceu sua senha?
                </button>

                <button
                  className="login-auth-submit"
                  type="submit"
                  disabled={isLoading}
                >
                  <LogIn size={20} />{" "}
                  {isLoading ? "Entrando..." : "Entrar na conta"}
                </button>
              </form>

              <div className="login-divider">
                <span>ou</span>
              </div>

              <button
                className="google-login-button"
                type="button"
                onClick={handleGoogleLogin}
              >
                <span className="google-mark" aria-hidden="true">
                  G
                </span>
                Google
              </button>

              <p className="login-auth-register">
                Ainda não tem uma conta?{" "}
                <Link to="/register">Cadastre-se grátis</Link>
              </p>

              <div className="login-auth-professional">
                <strong>É profissional da beleza?</strong>
                <span>
                  Organize sua fila e seus atendimentos em um só lugar.
                </span>
                <Link to="/professionalRegister">
                  Venha trabalhar conosco →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
      </main>
      <SiteFooter />
    </div>
  );
}
