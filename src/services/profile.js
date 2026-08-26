import { API_ROUTES } from "../routes/apiRoutes";
import { apiRequest } from "./api";

export const getMyUserProfile = () => apiRequest(API_ROUTES.myUserProfile);

export const updateMyUserProfile = (profile) =>
  apiRequest(API_ROUTES.myUserProfile, {
    method: "PATCH",
    body: JSON.stringify(profile),
  });

export const deleteMyAccount = () =>
  apiRequest(API_ROUTES.myUserProfile, { method: "DELETE" });

export const changeMyPassword = ({
  currentPassword,
  newPassword,
  confirmPassword,
}) =>
  apiRequest(API_ROUTES.myUserPassword, {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
