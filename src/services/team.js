import { API_ROUTES } from "../routes/apiRoutes";
import { apiRequest } from "./api";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const sendTeamInvite = (email) =>
  apiRequest(API_ROUTES.teamInvites, {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email) }),
  });

export const acceptTeamInvite = (inviteId) =>
  apiRequest(API_ROUTES.acceptTeamInvite(inviteId), { method: "POST" });

export const declineTeamInvite = (inviteId) =>
  apiRequest(API_ROUTES.declineTeamInvite(inviteId), { method: "POST" });

export const createQuickTeamMember = (name) =>
  apiRequest(API_ROUTES.quickTeamMember, {
    method: "POST",
    body: JSON.stringify({ name: name.trim() }),
  });

export const removeTeamMember = (memberId) =>
  apiRequest(API_ROUTES.removeTeamMember(memberId), { method: "DELETE" });
