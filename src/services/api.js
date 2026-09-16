import axios from "axios";
import {
  clearAuthSession,
  getRefreshToken,
  loadAuthSession,
  replaceAuthTokens,
} from "../auth/authStorage";
import { ErrorDictionary } from "../constants/errorMessages";
import { API_ROUTES } from "../routes/apiRoutes";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const LGPD_REQUIRED_EVENT = "barberflow:lgpd-consent-required";
let pendingLgpdConsent = null;
let refreshRequest = null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Injeta o token em todas as requisições
apiClient.interceptors.request.use((config) => {
  if (config.skipAuth) {
    delete config.headers.Authorization;
    return config;
  }

  const token = loadAuthSession()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function redirectToLogin() {
  clearAuthSession();
  if (window.location.pathname !== "/login") window.location.replace("/login");
}

async function refreshSession() {
  if (refreshRequest) return refreshRequest;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    redirectToLogin();
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  refreshRequest = axios
    .post(
      `${API_BASE_URL}${API_ROUTES.refresh}`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    )
    .then(({ data }) => {
      if (!data?.accessToken || !data?.refreshToken) {
        throw new Error("A API não retornou os novos tokens da sessão.");
      }
      replaceAuthTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    })
    .catch((error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        redirectToLogin();
      }
      throw error;
    })
    .finally(() => {
      refreshRequest = null;
    });

  return refreshRequest;
}

export function refreshAuthSession() {
  return refreshSession();
}

// Desloga o usuário em caso de token expirado (exceto na tentativa de login)
function isLgpdPending(responseData) {
  const indicatesPendingConsent = (value) => {
    const normalized = String(value || "").toUpperCase();
    return (
      normalized.includes("LGPD_PENDING") ||
      (normalized.includes("LGPD") && normalized.includes("PEND"))
    );
  };

  if (typeof responseData === "string")
    return indicatesPendingConsent(responseData);

  try {
    return indicatesPendingConsent(JSON.stringify(responseData));
  } catch {
    return false;
  }
}

function waitForLgpdConsent() {
  if (!pendingLgpdConsent) {
    let resolveConsent;
    let rejectConsent;
    const promise = new Promise((resolve, reject) => {
      resolveConsent = resolve;
      rejectConsent = reject;
    });
    pendingLgpdConsent = { promise, resolveConsent, rejectConsent };
    window.dispatchEvent(new CustomEvent(LGPD_REQUIRED_EVENT));
  }
  return pendingLgpdConsent.promise;
}

export function completePendingLgpdConsent(token) {
  if (!pendingLgpdConsent) return;
  const { resolveConsent } = pendingLgpdConsent;
  pendingLgpdConsent = null;
  resolveConsent(token);
}

export function cancelPendingLgpdConsent() {
  if (!pendingLgpdConsent) return;
  const { rejectConsent } = pendingLgpdConsent;
  pendingLgpdConsent = null;
  rejectConsent(new Error("É necessário aceitar os termos para continuar."));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (requestError) => {
    const status = requestError.response?.status;
    const requestUrl = requestError.config?.url || "";
    const requestMethod = requestError.config?.method?.toUpperCase();
    const isConsentRequest = requestUrl.includes("/api/v1/lgpd-consents");
    const hasAuthenticatedSession = Boolean(localStorage.getItem("token"));
    const isPublicRequest =
      requestError.config?.skipAuth ||
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/reactivate") ||
      requestUrl.includes("/auth/password-resets") ||
      requestUrl.includes("/auth/passwords") ||
      (requestMethod === "POST" &&
        ["/api/users/client", "/api/users/professional"].includes(requestUrl));

    if (
      status === 403 &&
      hasAuthenticatedSession &&
      isLgpdPending({
        data: requestError.response?.data,
        headers: requestError.response?.headers,
        statusText: requestError.response?.statusText,
      }) &&
      !isConsentRequest &&
      !requestError.config?._lgpdRetry
    ) {
      try {
        const newToken = await waitForLgpdConsent();
        const retryConfig = {
          ...requestError.config,
          _lgpdRetry: true,
          headers: {
            ...requestError.config.headers,
            Authorization: `Bearer ${newToken}`,
          },
        };
        return apiClient.request(retryConfig);
      } catch (consentError) {
        return Promise.reject(consentError);
      }
    } else if (
      status === 401 &&
      !isPublicRequest &&
      !requestError.config?._authRetry
    ) {
      try {
        const newToken = await refreshSession();
        return apiClient.request({
          ...requestError.config,
          _authRetry: true,
          headers: {
            ...requestError.config.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    } else if (status === 401 && requestError.config?._authRetry) {
      redirectToLogin();
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
    error.code = data?.code ?? data?.errorCode;

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
