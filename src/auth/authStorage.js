const TOKEN_KEY = "token";
const ROLE_KEY = "role";
const USER_DATA_KEYS = [
  TOKEN_KEY,
  ROLE_KEY,
  "queue-client-session-id",
  "queue-client-ticket-code",
  "queue-last-notification",
];

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
  USER_DATA_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}
