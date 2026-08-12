export const API_ROUTES = Object.freeze({
  // --- AUTH & USERS ---
  login: "/api/auth/login",
  registerClient: "/api/users",
  registerProfessional: "/api/professionals",
  myUserProfile: "/api/users/me",
  myUserPassword: "/api/users/me/password",
  myProfessionalProfile: "/api/professionals/me",
  lgpdConsent: "/api/v1/lgpd-consents",

  // --- PASSWORD RECOVERY ---
  requestPasswordReset: "/api/auth/password-resets",
  validatePasswordReset: "/api/auth/password-resets/validate",
  resetPassword: "/api/auth/passwords",

  // --- QUEUE SESSIONS ---
  createQueueSession: "/api/queue-sessions",
  updateQueueStatus: "/api/queue-sessions/me/status",
  updateQueueSettings: "/api/queue-sessions/me",
  refreshQueueCode: "/api/queue-sessions/me/ticket-code",
  professionalDashboard: "/api/queue-sessions/me/dashboard",
  queueByCode: (ticketCode) =>
    `/api/queue-sessions/tickets/${encodeURIComponent(ticketCode)}`,

  // --- QUEUE ENTRIES ---
  myQueueStatus: "/api/queue-entries/me/status",
  joinQueue: "/api/queue-entries",
  callNext: (sessionId) =>
    `/api/queue-entries/sessions/${encodeURIComponent(sessionId)}/next`,
  startService: (entryId) =>
    `/api/queue-entries/${encodeURIComponent(entryId)}/start`,
  finishService: (entryId) =>
    `/api/queue-entries/${encodeURIComponent(entryId)}/finish`,
  cancelEntry: (entryId) =>
    `/api/queue-entries/${encodeURIComponent(entryId)}/cancel`,
  requeueEntry: (entryId) =>
    `/api/queue-entries/${encodeURIComponent(entryId)}/requeue`,
});
