export const API_ROUTES = Object.freeze({
  // --- AUTH & USERS ---
  login: "/api/auth/login",
  reactivate: "/api/auth/reactivate",
  registerClient: "/api/users/client",
  registerProfessional: "/api/users/professional",
  myUserProfile: "/api/users/me",
  myUserPassword: "/api/users/me/password",
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
  professionalDashboard: "/api/dashboard/professional",
  businesses: "/api/businesses",
  myBusiness: "/api/businesses/me",
  teamInvites: "/api/team-invites",
  acceptTeamInvite: (inviteId) =>
    `/api/team-invites/${encodeURIComponent(inviteId)}/accept`,
  declineTeamInvite: (inviteId) =>
    `/api/team-invites/${encodeURIComponent(inviteId)}/decline`,
  quickTeamMember: "/api/team-members/quick-create",
  removeTeamMember: (memberId) =>
    `/api/team-members/${encodeURIComponent(memberId)}`,
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
