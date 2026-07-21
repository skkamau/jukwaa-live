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
import { authApi, type AuthUser } from "./api/auth";
import { ApiError } from "./api/client";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identity: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refresh: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null),
    [isLoading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      setUser((await authApi.me()).user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null);
      else setUser(null);
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
      refresh,
      login: async (identity, password) =>
        setUser((await authApi.login({ identity, password })).user),
      register: async (data) => {
        const result = await authApi.register(data);
        setUser(result.user);
        return result.emailDeliveryAvailable;
      },
      logout: async () => {
        await authApi.logout();
        setUser(null);
      },
      logoutAll: async () => {
        await authApi.logoutAll();
        setUser(null);
      },
    }),
    [user, isLoading, refresh],
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
