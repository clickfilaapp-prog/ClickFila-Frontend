import axios from "axios";
import { ErrorDictionary } from "../constants/errorMessages";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const LGPD_ROUTE = "/lgpd-consent";
const LGPD_RETURN_URL_KEY = "lgpdReturnUrl";
let lgpdRedirectInProgress = false;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Injeta o token em todas as requisições
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Desloga o usuário em caso de token expirado (exceto na tentativa de login)
function isLgpdPending(responseData) {
  const indicatesPendingConsent = (value) => {
    const normalized = String(value || "").toUpperCase();
    return (
      normalized.includes("LGPD_PENDING") ||
      (normalized.includes("LGPD") && normalized.includes("PEND"))
    );
  };

  if (typeof responseData === "string") {
    return indicatesPendingConsent(responseData);
  }

  const candidates = [
    responseData?.errorCode,
    responseData?.code,
    responseData?.status,
    responseData?.message,
    responseData?.error,
  ];

  return candidates.some(indicatesPendingConsent);
}

apiClient.interceptors.response.use(
  (response) => response,
  (requestError) => {
    const status = requestError.response?.status;
    const requestUrl = requestError.config?.url || "";
    const requestMethod = requestError.config?.method?.toUpperCase();
    const isConsentRequest = requestUrl.includes("/api/v1/lgpd-consents");
    const hasAuthenticatedSession = Boolean(localStorage.getItem("token"));
    const isPublicRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/password-resets") ||
      requestUrl.includes("/auth/passwords") ||
      (requestMethod === "POST" &&
        ["/api/users", "/api/professionals"].includes(requestUrl));

    if (
      status === 403 &&
      hasAuthenticatedSession &&
      isLgpdPending(requestError.response?.data) &&
      !isConsentRequest &&
      window.location.pathname !== LGPD_ROUTE &&
      !lgpdRedirectInProgress
    ) {
      lgpdRedirectInProgress = true;
      sessionStorage.setItem(
        LGPD_RETURN_URL_KEY,
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      );
      window.location.replace(LGPD_ROUTE);
    } else if (status === 401 && !isPublicRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(requestError);
  },
);

export async function apiRequest(path, options = {}) {
  const { body, ...requestOptions } = options;
  try {
    const response = await apiClient.request({
      url: path,
      ...requestOptions,
      data: parseRequestBody(body),
    });
    return response.data ?? null;
  } catch (requestError) {
    const status = requestError.response?.status;
    const data = requestError.response?.data;

    const error = new Error(getErrorMessage(data, status));
    error.status = status;
    error.data = data;
    error.code = data?.errorCode;

    throw error;
  }
}

function getErrorMessage(data, status) {
  if (!data) return getFallbackMessage(status);
  if (typeof data === "string" && data.trim()) return data.trim();

  if (typeof data === "object") {
    if (data.errorCode && ErrorDictionary[data.errorCode]) {
      return ErrorDictionary[data.errorCode];
    }
    if (data.message) return data.message;
  }

  return getFallbackMessage(status);
}

function getFallbackMessage(status) {
  if (status === 409) return "Esta ação gerou um conflito no sistema.";
  if (status === 400 || status === 422)
    return "Confira os dados informados e tente novamente.";
  if (status === 401 || status === 403)
    return "Você não tem permissão para realizar esta ação.";
  if (status >= 500)
    return "O servidor encontrou um erro interno. Tente novamente em instantes.";
  return "Não foi possível conectar ao servidor. Verifique sua internet.";
}

function parseRequestBody(body) {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}
