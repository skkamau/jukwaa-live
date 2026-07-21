import { apiRequest } from "./client";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: "VIEWER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE";
  emailVerified: boolean;
  createdAt: string;
};
export type AuthCapabilities = {
  prelaunchTestEligible: boolean;
  prelaunchActivationAvailable: boolean;
};
type UserResponse = { user: AuthUser; capabilities: AuthCapabilities };
export type RegisterResponse = UserResponse & { emailDeliveryAvailable: boolean };

export const authApi = {
  me: () => apiRequest<UserResponse>("/auth/me"),
  register: (data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) =>
    apiRequest<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { identity: string; password: string }) =>
    apiRequest<UserResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
  logoutAll: () => apiRequest<void>("/auth/logout-all", { method: "POST" }),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>("/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    apiRequest<void>("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
  verifyEmail: (token: string) =>
    apiRequest<UserResponse>("/auth/email/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  resendVerification: (email: string) =>
    apiRequest<{ message: string }>("/auth/email/resend", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  activatePrelaunch: () =>
    apiRequest<UserResponse>("/auth/prelaunch/activate", { method: "POST" }),
};
