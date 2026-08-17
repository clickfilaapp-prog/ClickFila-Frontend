import React, { useEffect, useState } from "react";
import { Scissors, ShieldCheck, Sparkles } from "lucide-react";
import salonHero from "../assets/salao-feminino-masculino.png";
import salonHero2 from "../assets/salao-feminino-masculino-2.png";
import salonHero3 from "../assets/salao-feminino-masculino-3.png";
import SiteFooter from "./SiteFooter";

const IMAGES = [salonHero, salonHero2, salonHero3];

const CONTENT = {
  "choose-role": {
    eyebrow: "ESCOLHA SEU PERFIL",
    title: "Uma experiência feita para cada lado do atendimento.",
    description: "Escolha como deseja usar o Click Fila.",
    panel: [
      "Como você quer começar?",
      "Selecione o perfil que representa você.",
    ],
  },
  register: {
    eyebrow: "FEITO PARA VOCÊ",
    title: "Menos espera, mais tempo para se cuidar.",
    description: "Crie sua conta e acompanhe sua posição na fila.",
    panel: ["Cadastro de cliente", "Preencha seus dados para criar sua conta."],
  },
  "professional-register": {
    eyebrow: "SEU NEGÓCIO MAIS ORGANIZADO",
    title: "Sua própria fila, seus clientes no tempo certo.",
    description: "Cadastre-se para organizar seus atendimentos.",
    panel: ["Cadastro profissional", "Crie o acesso do seu estabelecimento."],
  },
};

/** Layout visual compartilhado; não é página e por isso fica em components. */
export default function AuthenticationLayout({ page, children }) {
  const [activeImage, setActiveImage] = useState(0);
  const content = CONTENT[page];

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveImage((current) => (current + 1) % IMAGES.length),
      8000,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="auth-page-with-footer">
      <main className="login-main">
        <section className="login-shell">
        <div className="login-intro">
          <div className="login-slideshow" aria-hidden="true">
            {IMAGES.map((image, index) => (
              <img
                className={`login-hero-image ${index === activeImage ? "active" : ""}`}
                src={image}
                alt=""
                key={image}
              />
            ))}
          </div>
          <div className="login-image-overlay" />
          <div className="login-glow" />
          <div className="login-brand">
            <span>
              <Scissors size={19} />
            </span>{" "}
            Click <i>Fila</i>
          </div>
          <div className="login-copy login-copy-transition" key={page}>
            <span className="step">
              <Sparkles size={14} /> {content.eyebrow}
            </span>
            <h1>{content.title}</h1>
            <p>{content.description}</p>
          </div>
          <div className="login-trust">
            <ShieldCheck size={18} />
            <span>
              <strong>Acesso seguro</strong>Seus dados ficam protegidos.
            </span>
          </div>
        </div>
        <div className="login-panel">
          <div className="login-heading">
            <span className="login-mobile-brand">
              <Scissors size={17} /> Click Fila
            </span>
            <span className="step">NOVO CADASTRO</span>
            <h2>{content.panel[0]}</h2>
            <p>{content.panel[1]}</p>
          </div>
          {children}
        </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
