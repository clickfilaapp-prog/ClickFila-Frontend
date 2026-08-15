import React, { useState } from "react";
import { LogIn, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import salonHero from "../assets/salao-feminino-masculino.png";
import { saveAuthSession } from "../auth/authStorage";
import { getGoogleAuthorizationUrl } from "../auth/googleOAuth";
import PasswordField from "../components/PasswordField";
import PasswordResetFlow from "../components/PasswordResetFlow";
import { loginUser } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [recoveringPassword, setRecoveringPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await loginUser(email, password);
      const role = String(response.role || "")
        .replace(/^ROLE_/i, "")
        .toUpperCase();

      if (!response.token || !role) {
        console.error(
          "Falha de lógica: A API não retornou o token ou o role.",
          response,
        );
        throw new Error(
          "Ocorreu um problema ao carregar sua conta. Por favor, tente novamente.",
        );
      }
      saveAuthSession(response.token, role);
      navigate(
        role === "PROFESSIONAL" ? "/professionalDashboard" : "/clientQueue",
        { replace: true },
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-auth-main">
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

              <a
                className="google-login-button"
                href={getGoogleAuthorizationUrl()}
              >
                <span className="google-mark" aria-hidden="true">
                  G
                </span>
                Google
              </a>

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
  );
}
