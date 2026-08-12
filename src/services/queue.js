import { API_ROUTES } from "../routes/apiRoutes";
import { apiRequest } from "./api";

export const getQueueByCode = (ticketCode) =>
  apiRequest(API_ROUTES.queueByCode(ticketCode));
export const getMyQueueStatus = () => apiRequest(API_ROUTES.myQueueStatus);
export const getQueueState = getMyQueueStatus;
export const getActiveEntry = async () =>
  (await getMyQueueStatus())?.activeEntry ?? null;
export const getLatestEntry = async () =>
  (await getMyQueueStatus())?.latestHistoricalEntry ?? null;
export const joinQueue = (queueSessionId, serviceName) =>
  apiRequest(API_ROUTES.joinQueue, {
    method: "POST",
    body: JSON.stringify({ queueSessionId, serviceName }),
  });
export const createQueueSession = () =>
  apiRequest(API_ROUTES.createQueueSession, { method: "POST" });
export const setQueueStatus = (activate) =>
  apiRequest(API_ROUTES.updateQueueStatus, {
    method: "PATCH",
    body: JSON.stringify({ activate }),
  });
export const updateQueueSettings = (settings) =>
  apiRequest(API_ROUTES.updateQueueSettings, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
export const updateQueuePrefix = (prefix) => updateQueueSettings({ prefix });
export const updateQueueTolerance = (toleranceMinutes) =>
  updateQueueSettings({ toleranceMinutes });
export const refreshQueueCode = () =>
  apiRequest(API_ROUTES.refreshQueueCode, { method: "POST" });

function normalizeQueueEntry(entry) {
  if (!entry) return entry;
  return {
    ...entry,
    clientName:
      entry.clientName ||
      entry.userName ||
      entry.customerName ||
      entry.client?.name ||
      entry.user?.name ||
      entry.customer?.name ||
      entry.name ||
      "",
    serviceName:
      entry.serviceName ||
      entry.service?.name ||
      entry.observation ||
      entry.notes ||
      "",
  };
}
export async function getProfessionalDashboard() {
  const dashboard = await apiRequest(API_ROUTES.professionalDashboard);
  if (!dashboard) return null;
  return {
    ...dashboard,
    sessionId: dashboard.sessionId || dashboard.id || null,
    activeQueue: (dashboard.activeQueue || []).map(normalizeQueueEntry),
  };
}
export const callNext = (sessionId) =>
  apiRequest(API_ROUTES.callNext(sessionId), { method: "POST" });
export const startService = (entryId) =>
  apiRequest(API_ROUTES.startService(entryId), { method: "PATCH" });
export const finishService = (entryId) =>
  apiRequest(API_ROUTES.finishService(entryId), { method: "PATCH" });
export const cancelEntry = (entryId) =>
  apiRequest(API_ROUTES.cancelEntry(entryId), { method: "PATCH" });
export const requeueEntry = (entryId) =>
  apiRequest(API_ROUTES.requeueEntry(entryId), { method: "PATCH" });
