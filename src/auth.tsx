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
import { authApi, type AuthCapabilities, type AuthUser } from "./api/auth";
import { ApiError } from "./api/client";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  capabilities: AuthCapabilities;
  login: (identity: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) => Promise<{ emailDeliveryAvailable: boolean; emailVerified: boolean }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refresh: () => Promise<void>;
  activatePrelaunch: () => Promise<void>;
};
const noCapabilities: AuthCapabilities = {
  prelaunchTestEligible: false,
  prelaunchActivationAvailable: false,
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null),
    [capabilities, setCapabilities] = useState<AuthCapabilities>(noCapabilities),
    [isLoading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const result = await authApi.me();
      setUser(result.user);
      setCapabilities(result.capabilities);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null);
      else setUser(null);
      setCapabilities(noCapabilities);
    }
  }, []);
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      capabilities,
      refresh,
      login: async (identity, password) => {
        const result = await authApi.login({ identity, password });
        setUser(result.user);
        setCapabilities(result.capabilities);
      },
      register: async (data) => {
        const result = await authApi.register(data);
        setUser(result.user);
        setCapabilities(result.capabilities);
        return {
          emailDeliveryAvailable: result.emailDeliveryAvailable,
          emailVerified: result.user.emailVerified,
        };
      },
      activatePrelaunch: async () => {
        const result = await authApi.activatePrelaunch();
        setUser(result.user);
        setCapabilities(result.capabilities);
      },
      logout: async () => {
        await authApi.logout();
        setUser(null);
        setCapabilities(noCapabilities);
      },
      logoutAll: async () => {
        await authApi.logoutAll();
        setUser(null);
        setCapabilities(noCapabilities);
      },
    }),
    [user, capabilities, isLoading, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider missing");
  return value;
}
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth(),
    location = useLocation();
  if (isLoading)
    return <div className="auth-loading">Checking your session…</div>;
  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}
