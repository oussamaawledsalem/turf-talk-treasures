import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type StoredUser = {
  username: string;
  password: string;
  avatar: string;
  createdAt: number;
};

type AuthState = {
  user: StoredUser | null;
  login: (username: string, password: string) => { ok: true } | { ok: false; error: string };
  signup: (
    username: string,
    password: string,
    avatar: string,
  ) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  allUsers: () => StoredUser[];
  ready: boolean;
};

const USERS_KEY = "wc26_users";
const SESSION_KEY = "wc26_session";

const AuthCtx = createContext<AuthState | null>(null);

function readUsers(): Record<string, StoredUser> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeUsers(u: Record<string, StoredUser>) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sess = window.localStorage.getItem(SESSION_KEY);
    if (sess) {
      const users = readUsers();
      if (users[sess]) setUser(users[sess]);
    }
    setReady(true);
  }, []);

  const login: AuthState["login"] = (username, password) => {
    const users = readUsers();
    const u = users[username.toLowerCase()];
    if (!u) return { ok: false, error: "No such manager. Try signing up." };
    if (u.password !== password)
      return { ok: false, error: "Wrong password. The keeper saved it." };
    window.localStorage.setItem(SESSION_KEY, u.username);
    setUser(u);
    return { ok: true };
  };

  const signup: AuthState["signup"] = (username, password, avatar) => {
    const key = username.trim().toLowerCase();
    if (!key || key.length < 2) return { ok: false, error: "Pick a real name, at least 2 chars." };
    if (!password || password.length < 3) return { ok: false, error: "Password too short." };
    const users = readUsers();
    if (users[key]) return { ok: false, error: "That username is taken. Try harder." };
    const u: StoredUser = { username: key, password, avatar, createdAt: Date.now() };
    users[key] = u;
    writeUsers(users);
    window.localStorage.setItem(SESSION_KEY, key);
    setUser(u);
    return { ok: true };
  };

  const logout = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const allUsers = () => Object.values(readUsers());

  return (
    <AuthCtx.Provider value={{ user, login, signup, logout, allUsers, ready }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}