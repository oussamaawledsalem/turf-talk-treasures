import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi, type TokenResponse } from "./api/client";

// Shape kept identical to what components expect
export type StoredUser = {
  id: string;
  username: string;
  avatar: string;
};

type AuthState = {
  user: StoredUser | null;
  ready: boolean;
  login: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signup: (
    username: string,
    password: string,
    avatar: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
};

const TOKEN_KEY = "wc26_token";
const USER_KEY = "wc26_user";

const AuthCtx = createContext<AuthState | null>(null);

function saveSession(data: TokenResponse) {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ id: data.user_id, username: data.username, avatar: data.avatar }),
  );
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("AUTH PROVIDER RENDERED");  
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        clearSession();
      }
    }
    setReady(true);
  }, []);

  const login: AuthState["login"] = async (username, password) => {
    try {
      const data = await authApi.login(username, password);
      saveSession(data);
      setUser({ id: data.user_id, username: data.username, avatar: data.avatar });
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: (e as Error).message };
    }
  };

  const signup: AuthState["signup"] = async (username, password, avatar) => {
    if (!username.trim() || username.trim().length < 2)
      return { ok: false, error: "Pick a real name, at least 2 chars." };
    if (!password || password.length < 3)
      return { ok: false, error: "Password too short." };
    try {
      const data = await authApi.register(username.trim().toLowerCase(), password, avatar);
      saveSession(data);
      setUser({ id: data.user_id, username: data.username, avatar: data.avatar });
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: (e as Error).message };
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, ready, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);

  console.log("========== USE AUTH ==========");
  console.log("ctx =", ctx);
  console.log("==============================");

  if (!ctx) {
    throw new Error("useAuth outside provider");
  }

  return ctx;
}