import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Crown } from "lucide-react";
import { AppShell } from "@/components/kickoff/AppShell";
import { ImageSlot } from "@/components/kickoff/ImageSlot";
import { MatchCard } from "@/components/kickoff/MatchCard";
import { useAuth } from "@/lib/auth-context";
import { usePredictions } from "@/lib/predictions-context";
import { matchesApi, rankingApi, type ApiMatch, type RankingRow } from "@/lib/api/client";
import { matchHasStarted } from "@/lib/scoring";
import type { MatchViewModel } from "@/routes/schedule";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — KICKOFF" },
      { name: "description", content: "Your predictions, your stats." },
    ],
  }),
  component: () => (
    <AppShell>
      <ProfilePage />
    </AppShell>
  ),
});

type Filter = "all" | "exact" | "correct" | "missed" | "pending";

function toViewModel(m: ApiMatch): MatchViewModel {
  return {
    id: m.id,
    date: m.match_date,
    stage: m.stage,
    teamA: m.team_a,
    teamB: m.team_b,
    venue: m.venue ?? "",
    result:
      m.score_a !== null && m.score_b !== null
        ? { scoreA: m.score_a, scoreB: m.score_b }
        : null,
    status: m.status,
  };
}

function ProfilePage() {
  const { user } = useAuth();
  const { predictions } = usePredictions();
  const [filter, setFilter] = useState<Filter>("all");
  const [matches, setMatches] = useState<MatchViewModel[]>([]);
  const [myRank, setMyRank] = useState<RankingRow | null>(null);

  useEffect(() => {
    matchesApi.getAll().then((data) => setMatches(data.map(toViewModel))).catch(console.error);
  }, []);

  useEffect(() => {
    if (!user) return;
    rankingApi.getAll().then((rows) => {
      const me = rows.find((r) => r.username === user.username);
      if (me) setMyRank(me);
    }).catch(console.error);
  }, [user, predictions]);

  const myMatches = useMemo(() => {
    return matches.filter((m) => {
      const p = predictions[m.id];
      const pts = p?.points;
      if (filter === "all") return !!p;
      if (filter === "pending") return p && !m.result && !matchHasStarted(m.date);
      if (filter === "exact") return pts === 3;
      if (filter === "correct") return pts === 1;
      if (filter === "missed") return pts === 0;
      return true;
    });
  }, [matches, predictions, filter]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Profile hero */}
      <div className="relative rounded-2xl border border-turf-line bg-turf-mid overflow-hidden">
        <div className="pitch-stripes absolute inset-0 opacity-25 pointer-events-none" />
        <div className="relative p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="size-24 rounded-full border-[3px] border-gold bg-turf-deep flex items-center justify-center text-5xl">
            {user.avatar}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="font-display text-5xl text-floodlight tracking-wider flex items-center gap-2 justify-center md:justify-start">
              {user.username}
              {myRank?.rank === 1 && <Crown className="size-7 text-gold" />}
            </div>
            <div className="text-chalk-dim mt-1">
              {myRank ? `Rank #${myRank.rank}` : "Unranked"} ·{" "}
              <span className="text-gold font-bold">{myRank?.total_pts ?? 0} pts</span> ·{" "}
              {myRank?.exact ?? 0} exact · {myRank?.correct ?? 0} correct
            </div>
          </div>
          <ImageSlot
            src="/images/player-default-avatar.png"
            alt=""
            slotName="player-default-avatar.png"
            width="0"
            height="0"
            className="hidden"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <StatCard value={myRank?.predicted ?? 0} label="Predicted" />
        <StatCard value={myRank?.exact ?? 0} label="Exact ✅" />
        <StatCard value={myRank?.correct ?? 0} label="Correct" />
      </div>

      {/* Filter tabs */}
      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["exact", "✅ Exact"],
            ["correct", "🟡 Correct"],
            ["missed", "❌ Missed"],
            ["pending", "⏳ Pending"],
          ] as const
        ).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition ${
              filter === f
                ? "bg-gold text-turf-deep"
                : "border border-turf-line text-chalk-dim hover:text-chalk hover:border-chalk-dim"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Match cards */}
      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        {myMatches.length === 0 && (
          <div className="lg:col-span-2 py-16 text-center text-chalk-dim">
            Nothing here yet. Go predict something and come back a champion.
          </div>
        )}
        {myMatches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="relative rounded-xl border border-turf-line bg-turf-mid p-5 overflow-hidden">
      <div className="pitch-stripes absolute inset-0 opacity-25 pointer-events-none" />
      <div className="relative">
        <div className="font-scoreboard text-5xl text-gold">{value}</div>
        <div className="eyebrow mt-1">{label}</div>
      </div>
    </div>
  );
}