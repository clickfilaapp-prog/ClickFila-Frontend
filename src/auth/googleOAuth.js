const DEFAULT_API_URL = "http://localhost:8080";

export function getGoogleAuthorizationUrl() {
  const apiBaseUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(
    /\/$/,
    "",
  );

  return `${apiBaseUrl}/api/oauth2/authorization/google`;
}
