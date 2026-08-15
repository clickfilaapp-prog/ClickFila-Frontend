import { API_ROUTES } from "../routes/apiRoutes";
import { apiRequest } from "./api";

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const normalizePhone = (phone = "") => phone.replace(/\D/g, "");

export const loginUser = (email, password) =>
  apiRequest(API_ROUTES.login, {
    method: "POST",
    body: JSON.stringify({ login: normalizeEmail(email), password }),
  });

export const registerUser = ({ name, phone, email, password, termsAccepted }) =>
  apiRequest(API_ROUTES.registerClient, {
    method: "POST",
    body: JSON.stringify({
      login: normalizeEmail(email),
      password,
      name: name.trim(),
      phone: normalizePhone(phone),
      termsAccepted: termsAccepted === true,
    }),
  });

export const registerProfessional = ({
  name,
  businessName,
  phone,
  email,
  password,
  termsAccepted,
}) =>
  apiRequest(API_ROUTES.registerProfessional, {
    method: "POST",
    body: JSON.stringify({
      login: normalizeEmail(email),
      password,
      name: name.trim(),
      phone: normalizePhone(phone),
      businessName: businessName.trim(),
      termsAccepted: termsAccepted === true,
    }),
  });

export const acceptLgpdTerms = () =>
  apiRequest(API_ROUTES.lgpdConsent, { method: "POST" });

export const requestPasswordReset = (email) =>
  apiRequest(API_ROUTES.requestPasswordReset, {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email) }),
  });

export const validatePasswordReset = (email, code) =>
  apiRequest(API_ROUTES.validatePasswordReset, {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email), code }),
  });

export const resetPassword = ({ email, code, newPassword }) =>
  apiRequest(API_ROUTES.resetPassword, {
    method: "PATCH",
    body: JSON.stringify({ email: normalizeEmail(email), code, newPassword }),
  });
