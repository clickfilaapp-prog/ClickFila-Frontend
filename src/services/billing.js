import { API_ROUTES } from "../routes/apiRoutes";
import { apiRequest } from "./api";

export const getPlans = () =>
  apiRequest(API_ROUTES.plans, { method: "GET", skipAuth: true });

export const getMySubscription = () => apiRequest(API_ROUTES.mySubscription);

export const createSubscriptionCheckout = (checkoutData) =>
  apiRequest(API_ROUTES.subscriptionCheckout, {
    method: "POST",
    body: checkoutData,
  });

export const regularizeSubscription = (paymentData) =>
  apiRequest(API_ROUTES.subscriptionRegularize, {
    method: "POST",
    body: paymentData,
  });

export const getSubscriptionPixQrCode = () =>
  apiRequest(API_ROUTES.subscriptionPixQrCode, { method: "GET" });

export const changeSubscriptionPlan = (planData) =>
  apiRequest(API_ROUTES.subscriptionPlan, {
    method: "PUT",
    body: planData,
  });

export const updateSubscriptionPaymentMethod = (paymentData) =>
  apiRequest(API_ROUTES.subscriptionPaymentMethod, {
    method: "PUT",
    body: paymentData,
  });

export const cancelSubscription = (businessId) =>
  apiRequest(API_ROUTES.cancelSubscription(businessId), { method: "POST" });
