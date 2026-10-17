import { API_ROUTES } from "../routes/apiRoutes";
import { apiRequest } from "./api";

export const getPlans = () =>
  apiRequest(API_ROUTES.plans, { method: "GET", skipAuth: true });

export const getMySubscription = () => apiRequest(API_ROUTES.mySubscription);

export const createSubscriptionCheckout = (businessId, planCode) =>
  apiRequest(API_ROUTES.subscriptionCheckout, {
    method: "POST",
    body: { businessId, planCode },
  });

export const cancelSubscription = (businessId) =>
  apiRequest(API_ROUTES.cancelSubscription(businessId), { method: "POST" });

export const getPaymentUrl = (subscriptionOrCheckout) =>
  subscriptionOrCheckout?.checkoutUrl ||
  subscriptionOrCheckout?.paymentLink ||
  null;
