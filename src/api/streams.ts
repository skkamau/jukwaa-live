import { apiRequest } from "./client";

export type StreamStatus = "PREPARING" | "LIVE" | "ENDED" | "CANCELLED" | "FAILED";

export type PublicStream = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  language: string;
  tags: string[];
  matureContent: boolean;
  status: StreamStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  recordingAvailable: false;
  channel: { id: string; slug: string; name: string };
  creator: { username: string; displayName: string; avatarUrl: string | null };
  playback: null | {
    provider: "mock";
    kind: "development-placeholder";
    url: null;
  };
};

export type StreamInput = {
  title: string;
  description?: string;
  category: string;
  language: string;
  tags: string[];
  matureContent: boolean;
};

export type StreamingConfiguration = {
  provider: "mock";
  mode: "development";
  realVideoAvailable: false;
  developmentSimulationAvailable: boolean;
};

export const streamsApi = {
  live: () => apiRequest<{ streams: PublicStream[] }>("/streams/live"),
  detail: (id: string) =>
    apiRequest<{ stream: PublicStream }>(`/streams/${encodeURIComponent(id)}`),
  current: () => apiRequest<{ stream: PublicStream | null }>("/streams/me/current"),
  prepare: (data: StreamInput) =>
    apiRequest<{ stream: PublicStream }>("/streams/me/prepare", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (data: Partial<StreamInput>) =>
    apiRequest<{ stream: PublicStream }>("/streams/me/current", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  cancel: () =>
    apiRequest<{ stream: PublicStream }>("/streams/me/current/cancel", {
      method: "POST",
    }),
  simulateLive: () =>
    apiRequest<{ stream: PublicStream }>("/streams/me/current/simulate-live", {
      method: "POST",
    }),
  simulateEnd: () =>
    apiRequest<{ stream: PublicStream }>("/streams/me/current/simulate-end", {
      method: "POST",
    }),
  configuration: () =>
    apiRequest<{ streaming: StreamingConfiguration }>("/creators/me/streaming"),
};
