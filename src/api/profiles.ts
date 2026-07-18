import { apiRequest } from "./client";
import type { AuthUser } from "./auth";

export type Channel = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bannerUrl: string | null;
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  createdAt: string;
};

export type Creator = {
  id: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  verified: boolean;
  createdAt: string;
  channel: Channel | null;
};

export type PublicChannel = Channel & {
  creator: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    verified: boolean;
  };
};

export const profilesApi = {
  me: () => apiRequest<{ user: AuthUser }>("/users/me"),
  updateMe: (data: { displayName?: string; bio?: string; avatarUrl?: string }) =>
    apiRequest<{ user: AuthUser }>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  creatorMe: () => apiRequest<{ creator: Creator | null }>("/creators/me"),
  createCreator: (data: { name: string; slug: string; description?: string }) =>
    apiRequest<{ creator: Creator }>("/creators/me", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateChannel: (data: { name?: string; description?: string }) =>
    apiRequest<{ creator: Creator }>("/creators/me/channel", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  publicChannel: (slug: string) =>
    apiRequest<{ channel: PublicChannel }>(`/channels/${encodeURIComponent(slug)}`),
};
