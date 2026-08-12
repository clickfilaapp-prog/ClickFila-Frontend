import React from "react";
import { useNavigate } from "react-router-dom";
import AuthenticationLayout from "../components/AuthenticationLayout";
import RoleChoiceOptions from "../components/RoleChoice";

/** Segunda página do fluxo: escolha entre cliente e profissional. */
export default function RoleChoice() {
  const navigate = useNavigate();
  return (
    <AuthenticationLayout page="choose-role">
      <RoleChoiceOptions
        onClient={() => navigate("/clientRegister")}
        onProfessional={() => navigate("/professionalRegister")}
        onBack={() => navigate("/login")}
      />
    </AuthenticationLayout>
  );
}
