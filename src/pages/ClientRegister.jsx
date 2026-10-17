import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticationLayout from "../components/AuthenticationLayout";
import RegisterForm from "../components/RegisterForm";
import { saveAuthSession } from "../auth/authStorage";
import { loginUser, registerUser } from "../services/auth";

export default function ClientRegister() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(form) {
    setIsSubmitting(true);
    setError("");
    try {
      await registerUser(form);
      const response = await loginUser(form.email, form.password);

      saveAuthSession(
        response.token,
        response.refreshToken,
        response.role,
        response.tutorialCompleted === true,
        response.emailVerified ?? response.email_verified,
      );
      navigate("/clientQueue", {
        replace: true,
        state: { toast: "Cadastro criado com sucesso!" },
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
