import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import LgpdConsentGate from "./components/LgpdConsentGate";
import { AppRoutes } from "./routes";
import "./styles.css";

// Mantém o PWA instalável sem interceptar o convite nativo do navegador.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/notification-sw.js").catch((error) => {
      console.error("Não foi possível registrar o aplicativo:", error);
    });
  });
}

// Ponto de montagem do React. O BrowserRouter disponibiliza as rotas para toda a aplicação.
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <LgpdConsentGate>
      <AppRoutes />
    </LgpdConsentGate>
  </BrowserRouter>,
);
