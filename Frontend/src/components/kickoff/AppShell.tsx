import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Navbar, BottomNav } from "./Navbar";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/" });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-chalk-dim">
        <span className="animate-ball text-3xl">⚽</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-8">{children}</main>
      <BottomNav />
    </div>
  );
}