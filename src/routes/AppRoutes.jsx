import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { loadAuthSession, clearAuthSession } from "../auth/authStorage";
import {
  AuthCallback,
  ClientQueue,
  ClientRegister,
  Login,
  LgpdConsent,
  ProfessionalDashboard,
  ProfessionalRegister,
  ProfileSettings,
  RoleChoice,
} from "../pages";

const ROLE_HOME = Object.freeze({
  USER: "/clientQueue",
  PROFESSIONAL: "/professionalDashboard",
});

function RoleRoute({ role, children }) {
  const session = loadAuthSession();

  if (!session) return <Navigate to="/login" replace />;

  if (!ROLE_HOME[session.role]) {
    clearAuthSession();
    return <Navigate to="/login" replace />;
  }

  if (session.role !== role)
    return <Navigate to={ROLE_HOME[session.role]} replace />;

  return children;
}

function PublicRoute({ children }) {
  const session = loadAuthSession();

  if (session && ROLE_HOME[session.role])
    return <Navigate to={ROLE_HOME[session.role]} replace />;

  return children;
}

function HomeRoute() {
  const session = loadAuthSession();

  if (!session) return <Navigate to="/login" replace />;

  return (
    <Navigate
      to={
        session.role === "PROFESSIONAL"
          ? "/professionalDashboard"
          : "/clientQueue"
      }
      replace
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/inicio" element={<HomeRoute />} />
      <Route path="/lgpd-consent" element={<LgpdConsent />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RoleChoice />
          </PublicRoute>
        }
      />
      <Route
        path="/clientRegister"
        element={
          <PublicRoute>
            <ClientRegister />
          </PublicRoute>
        }
      />
      <Route
        path="/professionalRegister"
        element={
          <PublicRoute>
            <ProfessionalRegister />
          </PublicRoute>
        }
      />

      <Route
        path="/clientQueue"
        element={
          <RoleRoute role="USER">
            <ClientQueue />
          </RoleRoute>
        }
      />
      <Route
        path="/professionalDashboard"
        element={
          <RoleRoute role="PROFESSIONAL">
            <ProfessionalDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <RoleRoute role={loadAuthSession()?.role}>
            <ProfileSettings />
          </RoleRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
