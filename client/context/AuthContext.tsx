import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthCredentials, AuthResponse, RegisterPayload, UserProfile } from "@shared/api";
import { MockApi } from "@/mocks/api";
import { Navigate, useNavigate } from "react-router-dom";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (creds: AuthCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateUser: (u: UserProfile) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const LS_TOKEN = "myshelf.token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem(LS_TOKEN);
    setToken(t);
    (async () => {
      const u = await MockApi.getCurrentUser(t);
      setUser(u);
      setLoading(false);
    })();
  }, []);

  const handleAuth = useCallback((res: AuthResponse) => {
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem(LS_TOKEN, res.token);
  }, []);

  const login = useCallback(async (creds: AuthCredentials) => {
    const res = await MockApi.login(creds);
    handleAuth(res);
    navigate("/");
  }, [handleAuth, navigate]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await MockApi.register(payload);
    handleAuth(res);
    navigate("/");
  }, [handleAuth, navigate]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(LS_TOKEN);
    navigate("/auth");
  }, [navigate]);

  const value: AuthState = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};
