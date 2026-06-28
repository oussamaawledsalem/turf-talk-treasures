import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const exit = () => {
    logout();
    navigate({ to: "/" });
  };
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-turf-deep/90 border-b border-turf-line">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link to="/schedule" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-display text-3xl text-floodlight tracking-wider">KICKOFF</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/schedule" label="Schedule" />
          <NavLink to="/ranking" label="Ranking" />
          <NavLink to="/profile" label="Profile" />
          {user?.is_admin && <AdminNavLink />}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-chalk-dim">
              <span className="text-xl">{user.avatar}</span>
              <span className="text-chalk">{user.username}</span>
              {user.is_admin && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-crowd/20 text-crowd border border-crowd/40">
                  admin
                </span>
              )}
            </div>
          )}
          <button
            onClick={exit}
            className="inline-flex items-center gap-1 rounded-lg border border-turf-line px-3 py-1.5 text-sm text-chalk hover:border-red-card hover:text-red-card transition"
          >
            <LogOut className="size-4" /> Exit
          </button>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  to,
  label,
}: {
  to: "/schedule" | "/ranking" | "/profile";
  label: string;
}) {
  return (
    <Link
      to={to}
      className="px-4 py-2 font-display text-xl tracking-wider text-chalk-dim hover:text-chalk transition data-[status=active]:text-floodlight data-[status=active]:border-b-2 data-[status=active]:border-gold"
    >
      {label}
    </Link>
  );
}

function AdminNavLink() {
  return (
    <Link
      to="/admin"
      className="relative ml-2 px-4 py-2 font-display text-xl tracking-wider text-crowd/80 hover:text-crowd transition data-[status=active]:text-crowd data-[status=active]:border-b-2 data-[status=active]:border-crowd inline-flex items-center gap-1.5"
    >
      <Settings className="size-4" />
      Admin
      {/* pulsing dot */}
      <span className="absolute top-1.5 right-1 size-1.5 rounded-full bg-crowd animate-pulse" />
    </Link>
  );
}

export function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-turf-mid border-t border-turf-line">
      <div className={`grid ${isAdmin ? "grid-cols-4" : "grid-cols-3"}`}>
        {(
          [
            { to: "/schedule", label: "Schedule" },
            { to: "/ranking",  label: "Ranking"  },
            { to: "/profile",  label: "Profile"  },
          ] as const
        ).map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className="py-3 text-center font-display tracking-wider text-chalk-dim data-[status=active]:text-gold"
          >
            {it.label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            to="/admin"
            className="py-3 text-center font-display tracking-wider text-crowd/70 data-[status=active]:text-crowd"
          >
            ⚙️
          </Link>
        )}
      </div>
    </nav>
  );
}