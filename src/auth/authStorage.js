const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const ROLE_KEY = "role";
const TUTORIAL_COMPLETED_KEY = "tutorialCompleted";
const USER_DATA_KEYS = [
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  ROLE_KEY,
  TUTORIAL_COMPLETED_KEY,
  "queue-client-session-id",
  "queue-client-ticket-code",
];

function normalizeRole(role) {
  return String(role || "")
    .replace(/^ROLE_/i, "")
    .toUpperCase();
}

export function saveAuthSession(token, refreshToken, role, tutorialCompleted) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(ROLE_KEY, normalizeRole(role));
  if (typeof tutorialCompleted === "boolean") {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, String(tutorialCompleted));
  }
}

export function loadAuthSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token
    ? {
        token,
        refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
        role: localStorage.getItem(ROLE_KEY),
        tutorialCompleted:
          localStorage.getItem(TUTORIAL_COMPLETED_KEY) === null
            ? null
            : localStorage.getItem(TUTORIAL_COMPLETED_KEY) === "true",
      }
    : null;
}

export function replaceAuthTokens(token, refreshToken) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function removeAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function updateAuthRole(role) {
  localStorage.setItem(ROLE_KEY, normalizeRole(role));
}

export function updateTutorialCompleted(completed) {
  localStorage.setItem(TUTORIAL_COMPLETED_KEY, String(completed === true));
}

export function clearAuthSession() {
  USER_DATA_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}
