import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/kickoff/AppShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AppShell>
      <AdminPage />
    </AppShell>
  ),
});

const BASE = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("wc26_token");
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error" }));
    throw new Error(err.detail);
  }
  return res.json();
}

type AdminMatch = {
  id: string;
  api_id: number;
  match_date: string;
  stage: string;
  team_a_name: string;
  team_b_name: string;
  team_a_flag: string;
  team_b_flag: string;
  score_a: number | null;
  score_b: number | null;
  status: string;
  venue: string;
};

type Stats = {
  total_matches: number;
  finished_matches: number;
  pending_matches: number;
  total_predictions: number;
  total_users: number;
};

function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    const stored = localStorage.getItem("wc26_user");
    if (stored) {
      const u = JSON.parse(stored);
      if (!u.is_admin) navigate({ to: "/schedule" });
    } else {
      navigate({ to: "/" });
    }
  }, [navigate]);

  useEffect(() => {
    Promise.all([
      adminFetch<AdminMatch[]>("/admin/matches"),
      adminFetch<Stats>("/admin/stats"),
    ])
      .then(([m, s]) => {
        setMatches(m);
        setStats(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = matches.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      m.team_a_name.toLowerCase().includes(q) ||
      m.team_b_name.toLowerCase().includes(q);
    const matchesStage =
      stageFilter === "all" ||
      (stageFilter === "pending" && m.status !== "FT") ||
      (stageFilter === "finished" && m.status === "FT") ||
      (stageFilter === "group" && m.stage.startsWith("Group")) ||
      (stageFilter === "knockout" && !m.stage.startsWith("Group"));
    return matchesSearch && matchesStage;
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-6xl animate-bounce">⚽</div>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-20 text-red-card">
        ❌ {error} — are you logged in as admin?
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-4xl">🛡️</span>
        <div>
          <h1 className="font-display text-5xl text-floodlight tracking-wider">ADMIN PANEL</h1>
          <p className="text-chalk-dim text-sm">Enter match scores · Auto-scores all predictions</p>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Matches", value: stats.total_matches },
            { label: "Finished", value: stats.finished_matches },
            { label: "Pending", value: stats.pending_matches },
            { label: "Predictions", value: stats.total_predictions },
            { label: "Users", value: stats.total_users },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-turf-line bg-turf-mid p-4 text-center">
              <div className="font-scoreboard text-3xl text-gold">{s.value}</div>
              <div className="eyebrow mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams..."
          className="px-3 py-2 rounded-lg border border-turf-line bg-turf-mid text-chalk text-sm outline-none focus:border-gold w-48"
        />
        {["all", "pending", "finished", "group", "knockout"].map((f) => (
          <button
            key={f}
            onClick={() => setStageFilter(f)}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              stageFilter === f
                ? "bg-gold text-turf-deep"
                : "border border-turf-line text-chalk-dim hover:text-chalk"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Match list */}
      <div className="space-y-3">
        {filtered.map((m) => (
          <MatchScoreRow
            key={m.id}
            match={m}
            onScored={(updated) =>
              setMatches((prev) =>
                prev.map((x) => (x.id === updated.id ? updated : x))
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

function MatchScoreRow({
  match,
  onScored,
}: {
  match: AdminMatch;
  onScored: (m: AdminMatch) => void;
}) {
  const [scoreA, setScoreA] = useState(match.score_a ?? 0);
  const [scoreB, setScoreB] = useState(match.score_b ?? 0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isFinished = match.status === "FT";

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const result = await adminFetch<{ predictions_scored: number }>(
        `/admin/matches/${match.id}/score`,
        {
          method: "PATCH",
          body: JSON.stringify({ score_a: scoreA, score_b: scoreB }),
        }
      );
      setFeedback(`✅ Saved · ${result.predictions_scored} predictions scored`);
      onScored({ ...match, score_a: scoreA, score_b: scoreB, status: "FT" });
    } catch (e: unknown) {
      setFeedback(`❌ ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`rounded-xl border bg-turf-mid p-4 flex flex-col md:flex-row md:items-center gap-4 ${
        isFinished ? "border-turf-line opacity-70" : "border-gold/40"
      }`}
    >
      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="eyebrow text-gold mb-1">
          {match.stage} · {new Date(match.match_date).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </div>
        <div className="font-display text-2xl text-chalk tracking-wider">
          {match.team_a_flag} {match.team_a_name}{" "}
          <span className="text-chalk-dim">vs</span>{" "}
          {match.team_b_name} {match.team_b_flag}
        </div>
        {isFinished && (
          <div className="mt-1 text-sm text-chalk-dim">
            Final: <span className="text-floodlight font-scoreboard text-xl">{match.score_a}–{match.score_b}</span>
          </div>
        )}
      </div>

      {/* Score inputs */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <NumberInput value={scoreA} onChange={setScoreA} />
        <span className="font-display text-2xl text-chalk-dim">–</span>
        <NumberInput value={scoreB} onChange={setScoreB} />
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-gold text-turf-deep font-display text-lg tracking-wider hover:bg-floodlight transition disabled:opacity-50 flex-shrink-0"
        >
          {saving ? "..." : isFinished ? "Update" : "Set Score"}
        </button>
      </div>

      {feedback && (
        <div className="text-sm text-chalk-dim md:w-full">{feedback}</div>
      )}
    </div>
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center border border-turf-line rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="px-3 py-2 text-chalk hover:bg-turf-line transition font-bold"
      >
        −
      </button>
      <span className="px-3 font-scoreboard text-2xl text-chalk min-w-[2rem] text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="px-3 py-2 text-chalk hover:bg-turf-line transition font-bold"
      >
        +
      </button>
    </div>
  );
}