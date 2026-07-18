import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { profilesApi, type Creator } from "./api/profiles";

type CreatorContextValue = {
  creator: Creator | null;
  channel: Creator["channel"];
  isCreator: boolean;
  isLoadingCreator: boolean;
  refreshCreator: () => Promise<void>;
  createCreator: (data: { name: string; slug: string; description?: string }) => Promise<void>;
  updateChannel: (data: { name?: string; description?: string }) => Promise<void>;
};

const CreatorContext = createContext<CreatorContextValue | null>(null);

export function CreatorProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoadingCreator, setLoading] = useState(true);
  const refreshCreator = useCallback(async () => {
    if (!isAuthenticated) {
      setCreator(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setCreator((await profilesApi.creatorMe()).creator);
    } catch {
      setCreator(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  useEffect(() => {
    if (!isLoading) void refreshCreator();
  }, [isLoading, refreshCreator]);
  const value = useMemo<CreatorContextValue>(
    () => ({
      creator,
      channel: creator?.channel ?? null,
      isCreator: !!creator?.channel,
      isLoadingCreator,
      refreshCreator,
      createCreator: async (data) => setCreator((await profilesApi.createCreator(data)).creator),
      updateChannel: async (data) => setCreator((await profilesApi.updateChannel(data)).creator),
    }),
    [creator, isLoadingCreator, refreshCreator],
  );
  return <CreatorContext.Provider value={value}>{children}</CreatorContext.Provider>;
}

export function useCreator() {
  const value = useContext(CreatorContext);
  if (!value) throw new Error("CreatorProvider missing");
  return value;
}

export function CreatorRoute({ children }: { children: ReactNode }) {
  const { isCreator, isLoadingCreator } = useCreator();
  const location = useLocation();
  if (isLoadingCreator) return <div className="auth-loading">Loading your channel…</div>;
  return isCreator ? <>{children}</> : <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
}
