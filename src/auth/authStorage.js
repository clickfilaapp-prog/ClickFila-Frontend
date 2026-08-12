const TOKEN_KEY = "token";
const ROLE_KEY = "role";

function normalizeRole(role) {
  return String(role || "")
    .replace(/^ROLE_/i, "")
    .toUpperCase();
}

export function saveAuthSession(token, role) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, normalizeRole(role));
}

export function loadAuthSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { token, role: localStorage.getItem(ROLE_KEY) } : null;
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}
