import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Lock, EyeOff } from "lucide-react";
import { AppShell } from "@/components/kickoff/AppShell";
import { useAuth } from "@/lib/auth-context";
import { rankingApi, type RankingRow } from "@/lib/api/client";

export const Route = createFileRoute("/player/$username")({
  component: () => (
    <AppShell>
      <PlayerProfilePage />
    </AppShell>
  ),
});

const BASE = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("wc26_token");
}

type UserPrediction = {
  id: string;
  match_id: string;
  score_a: number;
  score_b: number;
  locked_at: string;
  points: number | null;
  matches: {
    match_date: string;
    team_a_name: string;
    team_b_name: string;
    team_a_flag: string;
    team_b_flag: string;
    score_a: number | null;
    score_b: number | null;
    status: string;
    stage: string;
  };
};

type ProfileData = {
  user: { id: string; username: string; avatar: string };
  predictions: UserPrediction[];
  hidden_count: number;
  restricted: boolean;
};

function PlayerProfilePage() {
  const { username } = Route.useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rankRow, setRankRow] = useState<RankingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log("Fetching profile for username:", profile);
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (!username || username === "undefined") { setError("User not found."); setLoading(false); return; }
    const token = getToken();
    if (!token) { setError("Login to view profiles."); setLoading(false); return; }

    Promise.all([
      fetch(`${BASE}/predictions/user/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => {
        if (!r.ok) throw new Error("User not found");
        return r.json();
      }),
      rankingApi.getAll(),
    ])
      .then(([profileData, ranking]) => {
        setProfile(profileData);
        const row = ranking.find((r) => r.username === username);
        if (row) setRankRow(row);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-6xl animate-bounce">⚽</div>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-20 text-chalk-dim">{error}</div>
    );

  if (!profile) return null;

  const { user, predictions, hidden_count } = profile;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Profile hero */}
      <div className="relative rounded-2xl border border-turf-line bg-turf-mid overflow-hidden mb-8">
        <div className="pitch-stripes absolute inset-0 opacity-25 pointer-events-none" />
        <div className="relative p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="size-24 rounded-full border-[3px] border-gold bg-turf-deep flex items-center justify-center text-5xl">
            {user.avatar}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="font-display text-5xl text-floodlight tracking-wider flex items-center gap-2 justify-center md:justify-start">
              {user.username}
              {rankRow?.rank === 1 && <Crown className="size-7 text-gold" />}
            </div>
            <div className="text-chalk-dim mt-1">
              {rankRow ? `Rank #${rankRow.rank}` : "Unranked"} ·{" "}
              <span className="text-gold font-bold">{rankRow?.total_pts ?? 0} pts</span> ·{" "}
              {rankRow?.exact ?? 0} exact · {rankRow?.correct ?? 0} correct
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { value: rankRow?.predicted ?? 0, label: "Predicted" },
          { value: rankRow?.exact ?? 0, label: "Exact ✅" },
          { value: rankRow?.correct ?? 0, label: "Correct" },
        ].map((s) => (
          <div key={s.label} className="relative rounded-xl border border-turf-line bg-turf-mid p-5 overflow-hidden">
            <div className="pitch-stripes absolute inset-0 opacity-25 pointer-events-none" />
            <div className="relative">
              <div className="font-scoreboard text-5xl text-gold">{s.value}</div>
              <div className="eyebrow mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Visibility notice */}
      {!isOwnProfile && hidden_count > 0 && currentUser?.username !== "oussama" && (
        <div className="flex items-center gap-3 rounded-xl border border-turf-line bg-turf-mid/60 px-4 py-3 mb-6 text-chalk-dim text-sm">
          <EyeOff className="size-4 flex-shrink-0 text-gold" />
          <span>
            <span className="text-chalk font-bold">{hidden_count} prediction{hidden_count > 1 ? "s" : ""} hidden</span>
            {" "}— predict those matches first to unlock them.
          </span>
        </div>
      )}

      {/* Predictions list */}
      <div className="space-y-3">
        {predictions.length === 0 && (
          <div className="text-center py-16 text-chalk-dim">
            {isOwnProfile
              ? "No predictions yet. Go predict something."
              : `Predict more matches to unlock ${user.username}'s picks.`}
          </div>
        )}

        {predictions.map((p) => {
          const m = p.matches;
          const hasResult = m.score_a !== null && m.score_b !== null;
          return (
            <div
              key={p.id}
              className={`rounded-xl border bg-turf-mid p-4 flex flex-col md:flex-row md:items-center gap-4 ${
                p.points === 3
                  ? "border-l-[3px] border-l-gold border-turf-line"
                  : p.points === 0
                    ? "border-l-[3px] border-l-red-card border-turf-line"
                    : "border-turf-line"
              }`}
            >
              <div className="flex-1">
                <div className="eyebrow text-gold mb-1">{m.stage}</div>
                <div className="font-display text-xl text-chalk tracking-wider">
                  {m.team_a_name} vs {m.team_b_name}
                </div>
              </div>

              <div className="flex items-center gap-6 text-center">
                {/* Their pick */}
                <div>
                  <div className="eyebrow">Pick</div>
                  <div className="font-scoreboard text-2xl text-chalk flex items-center gap-1">
                    <Lock className="size-3 text-gold" />
                    {p.score_a}–{p.score_b}
                  </div>
                </div>

                {/* Final result */}
                {hasResult && (
                  <>
                    <div>
                      <div className="eyebrow">Final</div>
                      <div className="font-scoreboard text-2xl text-floodlight">
                        {m.score_a}–{m.score_b}
                      </div>
                    </div>
                    <div>
                      <div className="eyebrow">Pts</div>
                      <div className={`font-scoreboard text-2xl ${
                        p.points === 3 ? "text-gold"
                          : p.points === 1 ? "text-sky"
                            : "text-red-card"
                      }`}>
                        {p.points === 3 ? "+3 🎉" : p.points === 1 ? "+1 ✅" : "0 ❌"}
                      </div>
                    </div>
                  </>
                )}

                {!hasResult && (
                  <div className="text-chalk-dim text-sm">⏳ Pending</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
