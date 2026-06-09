import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Crown } from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/kickoff/AppShell";
import { ImageSlot } from "@/components/kickoff/ImageSlot";
import { useAuth } from "@/lib/auth-context";
import { usePredictions } from "@/lib/predictions-context";
import { MATCHES } from "@/lib/schedule-data";
import { computeStats, type UserStats } from "@/lib/scoring";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — KICKOFF" },
      { name: "description", content: "The leaderboard. Who called it? Who didn't." },
    ],
  }),
  component: () => (
    <AppShell>
      <RankingPage />
    </AppShell>
  ),
});

function RankingPage() {
  const { user, allUsers } = useAuth();
  const { getAllForUser } = usePredictions();

  const rows: UserStats[] = useMemo(() => {
    const users = allUsers();
    const list = users.map((u) =>
      computeStats(u.username, u.avatar, getAllForUser(u.username), MATCHES),
    );
    list.sort(
      (a, b) =>
        b.points - a.points ||
        b.exact - a.exact ||
        b.correct - a.correct ||
        a.username.localeCompare(b.username),
    );
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const top3 = rows.slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="relative rounded-2xl border border-turf-line bg-turf-mid overflow-hidden">
        <div className="pitch-stripes absolute inset-0 opacity-25 pointer-events-none" />
        <div className="absolute inset-0">
          <ImageSlot
            src="/images/confetti-overlay.png"
            alt="confetti"
            slotName="confetti-overlay.png"
            height="100%"
          />
          <div className="absolute inset-0 bg-turf-mid/70" />
        </div>
        <div className="relative p-8 text-center">
          <div className="text-5xl">🏆</div>
          <h1 className="font-display text-6xl md:text-7xl text-floodlight tracking-wider">
            THE LEADERBOARD
          </h1>
          <p className="text-chalk-dim mt-1">Who called it? Who didn't.</p>
        </div>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-4 items-end max-w-xl mx-auto">
          <PodiumSpot stats={top3[1]} place={2} height="h-32" />
          <PodiumSpot stats={top3[0]} place={1} height="h-44" leader />
          <PodiumSpot stats={top3[2]} place={3} height="h-24" />
        </div>
      )}

      {/* Table */}
      <div className="mt-10 rounded-2xl border border-turf-line bg-turf-mid overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_70px_70px_90px] md:grid-cols-[60px_1fr_100px_100px_120px] px-4 py-3 eyebrow border-b border-turf-line bg-turf-deep">
          <div>#</div>
          <div>Player</div>
          <div className="text-center">Exact</div>
          <div className="text-center">Correct</div>
          <div className="text-right">Total pts</div>
        </div>
        {rows.length === 0 && (
          <div className="p-8 text-center text-chalk-dim">
            You're currently in first place. Also last place. Invite someone.
          </div>
        )}
        {rows.map((r, i) => {
          const isMe = user && r.username === user.username;
          return (
            <motion.div
              key={r.username}
              layout
              className={`grid grid-cols-[40px_1fr_70px_70px_90px] md:grid-cols-[60px_1fr_100px_100px_120px] px-4 py-3 items-center border-b border-turf-line last:border-b-0 ${
                isMe ? "border-l-[3px] border-l-gold bg-gold/5" : ""
              }`}
            >
              <div className="font-scoreboard text-2xl text-chalk-dim">
                {i + 1}
                {i === 0 && <Crown className="inline ml-1 size-4 text-gold" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{r.avatar}</span>
                <span className="font-display text-xl text-chalk tracking-wider">
                  {r.username}
                </span>
                {isMe && (
                  <span className="eyebrow text-gold ml-1">[YOU]</span>
                )}
              </div>
              <div className="text-center font-scoreboard text-2xl text-gold">{r.exact}</div>
              <div className="text-center font-scoreboard text-2xl text-sky">{r.correct}</div>
              <div className="text-right font-scoreboard text-3xl text-floodlight">
                {r.points}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PodiumSpot({
  stats,
  place,
  height,
  leader,
}: {
  stats: UserStats | undefined;
  place: number;
  height: string;
  leader?: boolean;
}) {
  if (!stats) return <div />;
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-4xl mb-1">{stats.avatar}</div>
      <div className="font-display text-xl text-chalk tracking-wider flex items-center gap-1">
        {stats.username}
        {leader && <Crown className="size-4 text-gold" />}
      </div>
      <div
        className={`font-scoreboard text-2xl ${leader ? "text-gold" : "text-chalk"}`}
      >
        {stats.points} pts
      </div>
      <div
        className={`mt-2 w-full ${height} rounded-t-lg border border-turf-line ${
          leader ? "bg-gold/30" : "bg-turf-mid"
        } flex items-start justify-center pt-2`}
      >
        <span className="text-3xl">{medal}</span>
      </div>
    </div>
  );
}