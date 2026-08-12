import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticationLayout from "../components/AuthenticationLayout";
import RegisterForm from "../components/RegisterForm";
import { registerUser } from "../services/auth";

export default function ClientRegister() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(form) {
    setIsSubmitting(true);
    setError("");
    try {
      await registerUser(form);
      navigate("/login", {
        state: { message: "Cadastro criado. Entre com seu e-mail e senha." },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthenticationLayout page="register">
      <RegisterForm
        role="client"
        onSubmit={handleRegister}
        isSubmitting={isSubmitting}
        requestError={error}
        onBack={() => navigate("/register")}
      />
    </AuthenticationLayout>
  );
}
