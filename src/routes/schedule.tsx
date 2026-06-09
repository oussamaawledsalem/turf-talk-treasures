import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { AppShell } from "@/components/kickoff/AppShell";
import { ImageSlot } from "@/components/kickoff/ImageSlot";
import { MatchCard } from "@/components/kickoff/MatchCard";
import {
  MATCHES,
  STAGE_FILTERS,
  matchInFilter,
  type StageFilter,
} from "@/lib/schedule-data";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule — KICKOFF" },
      { name: "description", content: "Every match of the FIFA World Cup 2026 — predict inline." },
      { property: "og:title", content: "Schedule — KICKOFF" },
      { property: "og:description", content: "Every match of the FIFA World Cup 2026." },
    ],
  }),
  component: () => (
    <AppShell>
      <SchedulePage />
    </AppShell>
  ),
});

function SchedulePage() {
  const [filter, setFilter] = useState<StageFilter>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return MATCHES.filter((m) => {
      if (!matchInFilter(m, filter)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !m.teamA.name.toLowerCase().includes(q) &&
          !m.teamB.name.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [filter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const m of filtered) {
      const key = format(new Date(m.date), "EEEE, MMMM d");
      const arr = map.get(key) || [];
      arr.push(m);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[220px] overflow-hidden">
        <ImageSlot
          src="/images/hero-banner.jpg"
          alt="Stadium banner"
          slotName="hero-banner.jpg"
          height="100%"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-turf-deep/40 via-turf-deep/70 to-turf-deep" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-display text-5xl md:text-7xl text-floodlight tracking-wider leading-none">
            WORLD CUP 2026
          </h1>
          <p className="mt-2 text-chalk-dim text-sm md:text-base">
            Jun 11 – Jul 19 · USA · Canada · Mexico
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-20 bg-turf-deep/95 backdrop-blur border-b border-turf-line">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {STAGE_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition ${
                  filter === s
                    ? "bg-gold text-turf-deep"
                    : "border border-turf-line text-chalk-dim hover:text-chalk hover:border-chalk-dim"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-chalk-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams..."
              className="pl-8 pr-3 py-1.5 rounded-md border border-turf-line bg-turf-mid text-chalk text-sm outline-none focus:border-gold w-56"
            />
          </div>
        </div>
      </div>

      {/* Matches */}
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
        {grouped.length === 0 && (
          <div className="text-center text-chalk-dim py-20">
            No matches match that filter. The tournament hasn't been cancelled yet.
          </div>
        )}
        {grouped.map(([day, matches]) => (
          <section key={day}>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="font-display text-3xl text-floodlight tracking-wider">{day}</h2>
              <span className="text-chalk-dim text-sm">[{matches.length} matches]</span>
              <div className="flex-1 border-b border-turf-line" />
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}