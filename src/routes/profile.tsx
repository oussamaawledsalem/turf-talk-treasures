import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Crown } from "lucide-react";
import { AppShell } from "@/components/kickoff/AppShell";
import { ImageSlot } from "@/components/kickoff/ImageSlot";
import { MatchCard } from "@/components/kickoff/MatchCard";
import { useAuth } from "@/lib/auth-context";
import { usePredictions } from "@/lib/predictions-context";
import { MATCHES } from "@/lib/schedule-data";
import { calculatePoints, computeStats, matchHasStarted } from "@/lib/scoring";

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

function ProfilePage() {
  const { user, allUsers } = useAuth();
  const { predictions, getAllForUser } = usePredictions();
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => {
    if (!user) return null;
    return computeStats(user.username, user.avatar, predictions, MATCHES);
  }, [user, predictions]);

  const rank = useMemo(() => {
    if (!user) return null;
    const all = allUsers().map((u) =>
      computeStats(u.username, u.avatar, getAllForUser(u.username), MATCHES),
    );
    all.sort(
      (a, b) =>
        b.points - a.points || b.exact - a.exact || b.correct - a.correct,
    );
    return all.findIndex((u) => u.username === user.username) + 1;
  }, [user, allUsers, getAllForUser]);

  const myMatches = useMemo(() => {
    return MATCHES.filter((m) => {
      const p = predictions[m.id];
      const pts = calculatePoints(p, m.result);
      if (filter === "all") return p || m.result;
      if (filter === "pending") return p && !m.result && !matchHasStarted(m);
      if (filter === "exact") return pts === 3;
      if (filter === "correct") return pts === 1;
      if (filter === "missed") return pts === 0;
      return true;
    });
  }, [predictions, filter]);

  if (!user || !stats) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="relative rounded-2xl border border-turf-line bg-turf-mid overflow-hidden">
        <div className="pitch-stripes absolute inset-0 opacity-25 pointer-events-none" />
        <div className="relative p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="size-24 rounded-full border-[3px] border-gold bg-turf-deep flex items-center justify-center text-5xl">
              {user.avatar}
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="font-display text-5xl text-floodlight tracking-wider flex items-center gap-2 justify-center md:justify-start">
              {user.username}
              {rank === 1 && <Crown className="size-7 text-gold" />}
            </div>
            <div className="text-chalk-dim mt-1">
              {rank ? `Rank #${rank}` : "Unranked"} ·{" "}
              <span className="text-gold font-bold">{stats.points} pts</span> · {stats.exact} exact · {stats.correct} correct
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

      <div className="grid grid-cols-3 gap-4 mt-6">
        <StatCard value={stats.predicted} label="Predicted" />
        <StatCard value={stats.exact} label="Exact ✅" />
        <StatCard value={stats.correct} label="Correct" />
      </div>

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