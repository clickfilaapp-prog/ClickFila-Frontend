import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import LgpdConsentGate from "./components/LgpdConsentGate";
import { AppRoutes } from "./routes";
import "./styles.css";

// Ponto de montagem do React. O BrowserRouter disponibiliza as rotas para toda a aplicação.
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <LgpdConsentGate>
      <AppRoutes />
    </LgpdConsentGate>
  </BrowserRouter>,
);
