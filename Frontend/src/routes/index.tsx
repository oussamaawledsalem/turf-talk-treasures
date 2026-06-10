import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { ImageSlot } from "@/components/kickoff/ImageSlot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KICKOFF — World Cup 2026 Prediction Game" },
      {
        name: "description",
        content: "Predict every match of the World Cup 2026. Climb the ranking. Own bragging rights.",
      },
    ],
  }),
  component: AuthPage,
});

const AVATARS = ["⚽", "🦁", "🦅", "🐉", "🌟", "🔥"];

function AuthPage() {
  const { user, ready, login, signup } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("⚽");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/schedule" });
  }, [ready, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result =
      tab === "login"
        ? await login(username, password)
        : await signup(username, password, avatar);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate({ to: "/schedule" }), 350);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <ImageSlot
          src="/images/login-bg.jpg"
          alt="Football pitch background"
          slotName="login-bg.jpg"
          height="100%"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-turf-deep via-turf-deep/95 to-turf-deep/40" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10 min-h-screen grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-5xl">⚽</span>
            <h1 className="font-display text-7xl md:text-8xl text-floodlight tracking-wider leading-none">
              KICKOFF
            </h1>
          </div>
          <p className="mt-4 text-chalk text-xl max-w-md">
            Predict every match. <span className="text-gold">Own the ranking.</span>
          </p>

          <div className="mt-10 max-w-md rounded-2xl border border-turf-line bg-turf-mid/90 backdrop-blur p-6">
            <div className="flex gap-1 mb-6 rounded-lg bg-turf-deep p-1 border border-turf-line">
              <TabBtn active={tab === "login"} onClick={() => setTab("login")}>Login</TabBtn>
              <TabBtn active={tab === "signup"} onClick={() => setTab("signup")}>Sign Up</TabBtn>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <Field label="Username" value={username} onChange={setUsername} placeholder="manager_name" />
              <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />

              {tab === "signup" && (
                <div>
                  <div className="eyebrow mb-2">Pick your avatar</div>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATARS.map((a) => (
                      <button
                        type="button"
                        key={a}
                        onClick={() => setAvatar(a)}
                        className={`h-12 rounded-lg border text-2xl transition ${
                          avatar === a ? "border-gold bg-gold/10" : "border-turf-line hover:border-chalk-dim"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <div className="text-red-card text-sm">❌ {error}</div>}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                animate={success ? { backgroundColor: "#fffbe6" } : {}}
                className="mt-2 w-full rounded-lg bg-gold py-3 font-display text-2xl tracking-wider text-turf-deep hover:bg-floodlight transition disabled:opacity-60"
              >
                {loading
                  ? "..."
                  : tab === "login"
                    ? "Enter the pitch →"
                    : "Join the game →"}
              </motion.button>

              <p className="text-center text-chalk-dim text-xs">
                {tab === "login"
                  ? "No account? It's free and takes 20 seconds."
                  : "By signing up you agree to talk trash about everyone's predictions."}
              </p>
            </form>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-gold/20 blur-3xl" />
            <ImageSlot
              src="/images/trophy.png"
              alt="World Cup trophy"
              slotName="trophy.png"
              width="380px"
              height="480px"
              objectFit="contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md py-2 font-display tracking-wider transition ${
        active ? "bg-gold text-turf-deep" : "text-chalk-dim hover:text-chalk"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="eyebrow">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="rounded-lg border border-turf-line bg-turf-deep px-3 py-2.5 text-chalk placeholder:text-chalk-dim/60 outline-none focus:border-gold transition"
      />
    </label>
  );
}