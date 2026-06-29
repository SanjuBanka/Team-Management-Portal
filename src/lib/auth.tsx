import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  seedIfEmpty,
  subscribe,
  updateProfile,
  type User,
} from "./store";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; role?: string }) => Promise<void>;
  logout: () => void;
  updateMe: (updates: Partial<Pick<User, "name" | "email" | "role">>) => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedIfEmpty();
    setUser(getCurrentUser());
    setLoading(false);
    return subscribe(() => setUser(getCurrentUser()));
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    async login(email, password) {
      const u = loginUser(email, password);
      setUser(u);
    },
    async register(input) {
      const u = registerUser(input);
      setUser(u);
    },
    logout() {
      logoutUser();
      setUser(null);
    },
    async updateMe(updates) {
      const u = updateProfile(updates);
      setUser(u);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}