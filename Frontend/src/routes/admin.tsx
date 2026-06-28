import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Plus, Trophy, Trash2, Settings, GitBranch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/kickoff/AppShell";
import { ScoreInput } from "@/components/kickoff/ScoreInput";
import {
  matchesApi,
  adminApi,
  type ApiMatch,
  type CreateMatchPayload,
} from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — KICKOFF" }] }),
  component: () => (
    <AppShell>
      <AdminGuard />
    </AppShell>
  ),
});

// ── Guard ─────────────────────────────────────────────────────────────────────

function AdminGuard() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && (!user || !user.is_admin)) navigate({ to: "/schedule" });
  }, [user, ready, navigate]);

  if (!ready || !user?.is_admin) return null;
  return <AdminPage />;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const KNOCKOUT_ROUNDS = [
  "Round of 32",
  "Round of 16",
  "Quarterfinal",
  "Semifinal",
  "Third Place",
  "Final",
] as const;
export const WC26_TEAMS: { name: string; code: string; flag: string }[] = [
  { name: "Algeria", code: "DZ", flag: "🇩🇿" },
  { name: "Argentina", code: "AR", flag: "🇦🇷" },
  { name: "Australia", code: "AU", flag: "🇦🇺" },
  { name: "Austria", code: "AT", flag: "🇦🇹" },
  { name: "Belgium", code: "BE", flag: "🇧🇪" },
  { name: "Bosnia and Herzegovina", code: "BA", flag: "🇧🇦" },
  { name: "Brazil", code: "BR", flag: "🇧🇷" },
  { name: "Cabo Verde", code: "CV", flag: "🇨🇻" },
  { name: "Canada", code: "CA", flag: "🇨🇦" },
  { name: "Colombia", code: "CO", flag: "🇨🇴" },
  { name: "Croatia", code: "HR", flag: "🇭🇷" },
  { name: "Curaçao", code: "CW", flag: "🇨🇼" },
  { name: "Czechia", code: "CZ", flag: "🇨🇿" },
  { name: "DR Congo", code: "CD", flag: "🇨🇩" },
  { name: "Ecuador", code: "EC", flag: "🇪🇨" },
  { name: "Egypt", code: "EG", flag: "🇪🇬" },
  { name: "England", code: "GB-ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "France", code: "FR", flag: "🇫🇷" },
  { name: "Germany", code: "DE", flag: "🇩🇪" },
  { name: "Ghana", code: "GH", flag: "🇬🇭" },
  { name: "Haiti", code: "HT", flag: "🇭🇹" },
  { name: "IR Iran", code: "IR", flag: "🇮🇷" },
  { name: "Iraq", code: "IQ", flag: "🇮🇶" },
  { name: "Ivory Coast", code: "CI", flag: "🇨🇮" },
  { name: "Japan", code: "JP", flag: "🇯🇵" },
  { name: "Jordan", code: "JO", flag: "🇯🇴" },
  { name: "Mexico", code: "MX", flag: "🇲🇽" },
  { name: "Morocco", code: "MA", flag: "🇲🇦" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿" },
  { name: "Norway", code: "NO", flag: "🇳🇴" },
  { name: "Panama", code: "PA", flag: "🇵🇦" },
  { name: "Paraguay", code: "PY", flag: "🇵🇾" },
  { name: "Portugal", code: "PT", flag: "🇵🇹" },
  { name: "Qatar", code: "QA", flag: "🇶🇦" },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦" },
  { name: "Scotland", code: "GB-SCT", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { name: "Senegal", code: "SN", flag: "🇸🇳" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦" },
  { name: "South Korea", code: "KR", flag: "🇰🇷" },
  { name: "Spain", code: "ES", flag: "🇪🇸" },
  { name: "Sweden", code: "SE", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", flag: "🇨🇭" },
  { name: "Tunisia", code: "TN", flag: "🇹🇳" },
  { name: "Türkiye", code: "TR", flag: "🇹🇷" },
  { name: "USA", code: "US", flag: "🇺🇸" },
  { name: "Uruguay", code: "UY", flag: "🇺🇾" },
  { name: "Uzbekistan", code: "UZ", flag: "🇺🇿" },
];
// ── Real Round of 32 schedule (source of truth for dates/times) ──────────────
// Tunisia local time (GMT+1, fixed offset) — converted to UTC when saved.
const R32_SCHEDULE: { teams: [string, string]; date: string; time: string }[] = [
  { teams: ["South Africa", "Canada"], date: "2026-06-28", time: "20:00" },
  { teams: ["Brazil", "Japan"], date: "2026-06-29", time: "18:00" },
  { teams: ["Germany", "Paraguay"], date: "2026-06-29", time: "21:30" },
  { teams: ["Netherlands", "Morocco"], date: "2026-06-30", time: "02:00" },
  { teams: ["Ivory Coast", "Norway"], date: "2026-06-30", time: "18:00" },
  { teams: ["France", "Sweden"], date: "2026-06-30", time: "22:00" },
  { teams: ["Mexico", "Ecuador"], date: "2026-07-01", time: "02:00" },
  { teams: ["England", "DR Congo"], date: "2026-07-01", time: "17:00" },
  { teams: ["Belgium", "Senegal"], date: "2026-07-01", time: "21:00" },
  { teams: ["USA", "Bosnia and Herzegovina"], date: "2026-07-02", time: "01:00" },
  { teams: ["Spain", "Austria"], date: "2026-07-02", time: "20:00" },
  { teams: ["Portugal", "Croatia"], date: "2026-07-03", time: "00:00" },
  { teams: ["Switzerland", "Algeria"], date: "2026-07-03", time: "04:00" },
  { teams: ["Australia", "Egypt"], date: "2026-07-03", time: "19:00" },
  { teams: ["Argentina", "Cabo Verde"], date: "2026-07-03", time: "23:00" },
  { teams: ["Colombia", "Ghana"], date: "2026-07-04", time: "02:30" },
];

function tunisiaToUtcIso(date: string, time: string): string {
  // Tunisia is fixed GMT+1, no DST
  return new Date(`${date}T${time}:00+01:00`).toISOString();
}

function findScheduleEntry(teamAName: string, teamBName: string) {
  return R32_SCHEDULE.find(
    ({ teams: [x, y] }) =>
      (x === teamAName && y === teamBName) || (x === teamBName && y === teamAName)
  );
}
// ── Toast ─────────────────────────────────────────────────────────────────────

type Toast = { msg: string; type: "ok" | "err" } | null;

function ToastBanner({ toast }: { toast: Toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-xl border ${
            toast.type === "ok"
              ? "bg-turf-mid border-crowd/50 text-crowd"
              : "bg-turf-mid border-red-card/50 text-red-card"
          }`}
        >
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────────────

type Tab = "matches" | "bracket";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("matches");
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const reload = () => {
    setLoadingMatches(true);
    matchesApi
      .getAll()
      .then(setMatches)
      .catch(() => showToast("Failed to load matches.", "err"))
      .finally(() => setLoadingMatches(false));
  };

  useEffect(() => { reload(); }, []);

  const knockoutMatches = matches.filter((m) => !m.stage.startsWith("Group"));
  const withoutResult   = matches.filter((m) => m.score_a === null);

  // Group stage teams (finished groups) available for bracket drag
  const groupTeams = matches
    .filter((m) => m.stage.startsWith("Group"))
    .flatMap((m) => [m.team_a, m.team_b])
    .filter((t, i, arr) => arr.findIndex((x) => x.code === t.code) === i);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-turf-mid border-b border-crowd/30 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg,transparent,transparent 80px,rgba(108,63,197,0.4) 80px,rgba(108,63,197,0.4) 81px)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-8 flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-crowd/20 border border-crowd/40 flex items-center justify-center">
            <Settings className="size-7 text-crowd" />
          </div>
          <div>
            <h1 className="font-display text-5xl md:text-6xl tracking-wider">
              <span className="text-floodlight">MATCH </span>
              <span className="text-crowd">CONTROL</span>
              <span className="text-floodlight"> ROOM</span>
            </h1>
            <p className="mt-1 text-chalk-dim text-sm">
              Add knockout matches · Enter results · Build the bracket
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-20 bg-turf-deep/95 backdrop-blur border-b border-turf-line">
        <div className="mx-auto max-w-7xl px-4 flex gap-1 pt-2">
          {(
            [
              { id: "matches", label: "Match Forms",     icon: <Plus className="size-4" /> },
              { id: "bracket", label: "Tournament Bracket", icon: <GitBranch className="size-4" /> },
            ] as { id: Tab; label: string; icon: React.ReactNode }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 font-display text-lg tracking-wider rounded-t-lg transition border-b-2 ${
                tab === t.id
                  ? "text-crowd border-crowd bg-crowd/10"
                  : "text-chalk-dim border-transparent hover:text-chalk hover:border-turf-line"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <ToastBanner toast={toast} />

      {/* Tab content */}
      {tab === "matches" ? (
        <MatchFormsTab
          knockoutMatches={knockoutMatches}
          withoutResult={withoutResult}
          loadingMatches={loadingMatches}
          showToast={showToast}
          reload={reload}
        />
      ) : (
        <BracketTab
          groupTeams={groupTeams}
          showToast={showToast}
          reload={reload}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — MATCH FORMS
// ══════════════════════════════════════════════════════════════════════════════

function MatchFormsTab({
  knockoutMatches,
  withoutResult,
  loadingMatches,
  showToast,
  reload,
}: {
  knockoutMatches: ApiMatch[];
  withoutResult: ApiMatch[];
  loadingMatches: boolean;
  showToast: (msg: string, type?: "ok" | "err") => void;
  reload: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div className="grid lg:grid-cols-2 gap-6">
        <AddMatchForm
          onSuccess={(msg) => { showToast(msg); reload(); }}
          onError={(msg) => showToast(msg, "err")}
        />
        <EnterResultForm
          matches={withoutResult}
          onSuccess={(msg) => { showToast(msg); reload(); }}
          onError={(msg) => showToast(msg, "err")}
        />
      </div>

      {/* Knockout list */}
      <div>
        <div className="flex items-baseline gap-3 mb-5">
          <h2 className="font-display text-3xl text-floodlight tracking-wider">
            Knockout Matches
          </h2>
          <div className="flex-1 border-b border-turf-line" />
        </div>

        {loadingMatches ? (
          <div className="text-center py-16 text-chalk-dim">
            <div className="text-5xl animate-bounce">⚽</div>
            <p className="mt-3">Loading...</p>
          </div>
        ) : knockoutMatches.length === 0 ? (
          <div className="text-center py-16 text-chalk-dim border border-dashed border-turf-line rounded-2xl">
            <p className="text-lg">No knockout matches yet.</p>
            <p className="text-sm mt-1">
              Group stage still running — come back when the dust settles.
            </p>
          </div>
        ) : (
          <KnockoutList
            matches={knockoutMatches}
            onDelete={async (id) => {
              try {
                await adminApi.deleteMatch(id);
                showToast("🗑 Match removed.");
                reload();
              } catch (e: unknown) {
                showToast((e as Error).message ?? "Delete failed.", "err");
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Add Match Form ────────────────────────────────────────────────────────────

function AddMatchForm({
  onSuccess,
  onError,
}: {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [round, setRound]       = useState("");
  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("21:00");
  const [teamACode, setTeamACode] = useState("");
  const [teamBCode, setTeamBCode] = useState("");
  const [venue, setVenue]       = useState("");
  const [saving, setSaving]     = useState(false);

  const teamA    = WC26_TEAMS.find((t) => t.code === teamACode);
  const teamB    = WC26_TEAMS.find((t) => t.code === teamBCode);
  const teamsForB = WC26_TEAMS.filter((t) => t.code !== teamACode);
  const teamsForA = WC26_TEAMS.filter((t) => t.code !== teamBCode);
  const valid    = round && date && teamA && teamB;

  const submit = async () => {
    if (!valid || !teamA || !teamB) return;
    setSaving(true);
    try {
      const payload: CreateMatchPayload = {
        stage: round,
        match_date: `${date}T${time}:00Z`,
        team_a: teamA,
        team_b: teamB,
        venue: venue.trim() || undefined,
      };
      await adminApi.createMatch(payload);
      onSuccess("⚽ Match added! Players can predict it now.");
      setRound(""); setDate(""); setTime("21:00");
      setTeamACode(""); setTeamBCode(""); setVenue("");
    } catch (e: unknown) {
      onError((e as Error).message ?? "Failed to add match.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-crowd/30 bg-turf-mid overflow-hidden">
      <div className="px-5 py-4 border-b border-crowd/20 bg-crowd/10 flex items-center gap-2">
        <Plus className="size-5 text-crowd" />
        <span className="font-display text-2xl tracking-wider text-crowd">Add Knockout Match</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="eyebrow text-chalk-dim">Round</label>
          <select value={round} onChange={(e) => setRound(e.target.value)}
            className="w-full rounded-lg border border-turf-line bg-turf-deep text-chalk px-3 py-2.5 text-sm outline-none focus:border-crowd transition">
            <option value="">Select round…</option>
            {KNOCKOUT_ROUNDS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="eyebrow text-chalk-dim">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-turf-line bg-turf-deep text-chalk px-3 py-2.5 text-sm outline-none focus:border-crowd transition" />
          </div>
          <div className="space-y-1.5">
            <label className="eyebrow text-chalk-dim">Kick-off (UTC)</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-turf-line bg-turf-deep text-chalk px-3 py-2.5 text-sm outline-none focus:border-crowd transition" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="eyebrow text-chalk-dim">Team A</label>
            <select value={teamACode} onChange={(e) => setTeamACode(e.target.value)}
              className="w-full rounded-lg border border-turf-line bg-turf-deep text-chalk px-3 py-2.5 text-sm outline-none focus:border-crowd transition">
              <option value="">Select…</option>
              {teamsForA.map((t) => <option key={t.code} value={t.code}>{t.flag} {t.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="eyebrow text-chalk-dim">Team B</label>
            <select value={teamBCode} onChange={(e) => setTeamBCode(e.target.value)}
              className="w-full rounded-lg border border-turf-line bg-turf-deep text-chalk px-3 py-2.5 text-sm outline-none focus:border-crowd transition">
              <option value="">Select…</option>
              {teamsForB.map((t) => <option key={t.code} value={t.code}>{t.flag} {t.name}</option>)}
            </select>
          </div>
        </div>

        {teamA && teamB && (
          <div className="flex items-center justify-center gap-4 py-3 rounded-xl bg-turf-deep border border-turf-line">
            <span className="text-3xl">{teamA.flag}</span>
            <span className="font-display text-xl text-chalk-dim">VS</span>
            <span className="text-3xl">{teamB.flag}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="eyebrow text-chalk-dim">Venue (optional)</label>
          <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. MetLife Stadium, New Jersey"
            className="w-full rounded-lg border border-turf-line bg-turf-deep text-chalk px-3 py-2.5 text-sm outline-none focus:border-crowd transition placeholder:text-chalk-dim/40" />
        </div>

        <button onClick={submit} disabled={!valid || saving}
          className="w-full py-3 rounded-xl font-display text-xl tracking-wider transition bg-crowd text-white hover:bg-crowd/80 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
          <Plus className="size-5" />
          {saving ? "Adding…" : "Add Match"}
        </button>
      </div>
    </section>
  );
}

// ── Enter Result Form ─────────────────────────────────────────────────────────

function EnterResultForm({
  matches,
  onSuccess,
  onError,
}: {
  matches: ApiMatch[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [matchId, setMatchId] = useState("");
  const [scoreA, setScoreA]   = useState(0);
  const [scoreB, setScoreB]   = useState(0);
  const [saving, setSaving]   = useState(false);
  const selected = matches.find((m) => m.id === matchId);

  const submit = async () => {
    if (!matchId) return;
    setSaving(true);
    try {
      await adminApi.setResult(matchId, { score_a: scoreA, score_b: scoreB });
      onSuccess("✅ Result saved. Points updated for all players.");
      setMatchId(""); setScoreA(0); setScoreB(0);
    } catch (e: unknown) {
      onError((e as Error).message ?? "Failed to save result.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gold/30 bg-turf-mid overflow-hidden">
      <div className="px-5 py-4 border-b border-gold/20 bg-gold/10 flex items-center gap-2">
        <Trophy className="size-5 text-gold" />
        <span className="font-display text-2xl tracking-wider text-gold">Enter Match Result</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="eyebrow text-chalk-dim">
            Match{" "}
            <span className="text-chalk-dim/60 normal-case font-normal">
              ({matches.length} without result)
            </span>
          </label>
          {matches.length === 0 ? (
            <div className="rounded-lg border border-dashed border-turf-line px-4 py-6 text-center text-chalk-dim text-sm">
              All played matches already have results.<br />
              Nothing to do here — enjoy the game.
            </div>
          ) : (
            <select value={matchId}
              onChange={(e) => { setMatchId(e.target.value); setScoreA(0); setScoreB(0); }}
              className="w-full rounded-lg border border-turf-line bg-turf-deep text-chalk px-3 py-2.5 text-sm outline-none focus:border-gold transition">
              <option value="">Select a match…</option>
              {matches
                .slice()
                .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.team_a.flag} {m.team_a.name} vs {m.team_b.flag} {m.team_b.name}
                    {" · "}{format(new Date(m.match_date), "MMM d")}
                    {" · "}{m.stage}
                  </option>
                ))}
            </select>
          )}
        </div>

        {selected && (
          <div className="rounded-xl bg-turf-deep border border-turf-line p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-chalk-dim">{selected.stage}</span>
              <span className="text-chalk-dim text-xs">
                {format(new Date(selected.match_date), "EEE MMM d, HH:mm")}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl">{selected.team_a.flag}</span>
                <span className="font-display text-lg text-chalk">{selected.team_a.name}</span>
                <ScoreInput value={scoreA} onChange={setScoreA} />
              </div>
              <span className="font-display text-2xl text-chalk-dim">–</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl">{selected.team_b.flag}</span>
                <span className="font-display text-lg text-chalk">{selected.team_b.name}</span>
                <ScoreInput value={scoreB} onChange={setScoreB} />
              </div>
            </div>
          </div>
        )}

        <button onClick={submit} disabled={!matchId || saving || matches.length === 0}
          className="w-full py-3 rounded-xl font-display text-xl tracking-wider transition bg-gold text-turf-deep hover:bg-floodlight disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
          <Trophy className="size-5" />
          {saving ? "Saving…" : "Confirm Result"}
        </button>
      </div>
    </section>
  );
}

// ── Knockout List ─────────────────────────────────────────────────────────────

function KnockoutList({ matches, onDelete }: { matches: ApiMatch[]; onDelete: (id: string) => void }) {
  const order = KNOCKOUT_ROUNDS as unknown as string[];
  const grouped = order.reduce<Map<string, ApiMatch[]>>((acc, stage) => {
    const s = matches.filter((m) => m.stage === stage);
    if (s.length) acc.set(stage, s);
    return acc;
  }, new Map());

  return (
    <div className="space-y-8">
      {Array.from(grouped.entries()).map(([stage, stageMatches]) => (
        <div key={stage}>
          <h3 className="font-display text-xl tracking-wider text-crowd mb-3 uppercase">{stage}</h3>
          <div className="grid lg:grid-cols-2 gap-3">
            {stageMatches.map((m) => (
              <KnockoutMatchRow key={m.id} match={m} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function KnockoutMatchRow({ match, onDelete }: { match: ApiMatch; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const hasResult = match.score_a !== null && match.score_b !== null;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-turf-line bg-turf-mid p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl">{match.team_a.flag}</span>
          <span className="font-display text-lg text-chalk">{match.team_a.name}</span>
          <span className="text-chalk-dim">vs</span>
          <span className="font-display text-lg text-chalk">{match.team_b.name}</span>
          <span className="text-2xl">{match.team_b.flag}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-chalk-dim flex-wrap">
          <span>{format(new Date(match.match_date), "EEE MMM d, HH:mm")}</span>
          {match.venue && <><span>·</span><span>{match.venue}</span></>}
          {hasResult
            ? <span className="text-gold font-bold">✅ {match.score_a}–{match.score_b}</span>
            : <span className="text-chalk-dim/60">Result pending</span>}
        </div>
      </div>
      <div className="shrink-0">
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-card">Sure?</span>
            <button onClick={() => { onDelete(match.id); setConfirming(false); }}
              className="px-2 py-1 rounded text-xs bg-red-card text-white hover:bg-red-card/80 transition">Yes</button>
            <button onClick={() => setConfirming(false)}
              className="px-2 py-1 rounded text-xs border border-turf-line text-chalk-dim hover:text-chalk transition">No</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)}
            className="p-2 rounded-lg border border-turf-line text-chalk-dim hover:border-red-card hover:text-red-card transition">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — TOURNAMENT BRACKET
// ══════════════════════════════════════════════════════════════════════════════

type Team = { name: string; code: string; flag: string };
type SlotId = string; // e.g. "r32_0_a", "r16_1_b", "qf_0_a" ...

// Bracket structure: 32 → 16 → 8 → 4 → (3rd, Final)
// Each round has N matches, each match has slot _a and _b
const BRACKET_ROUNDS: { id: string; label: string; matches: number }[] = [
  { id: "r32", label: "Round of 32", matches: 16 },
  { id: "r16", label: "Round of 16", matches: 8  },
  { id: "qf",  label: "Quarterfinal", matches: 4  },
  { id: "sf",  label: "Semifinal",   matches: 2  },
  { id: "tp",  label: "3rd Place",   matches: 1  },
  { id: "f",   label: "Final",       matches: 1  },
];

const STORAGE_KEY = "wc26_bracket";

function loadBracket(): Record<SlotId, Team> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveBracket(b: Record<SlotId, Team>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
}

function BracketTab({
  groupTeams,
  showToast,
  reload,
}: {
  groupTeams: Team[];
  showToast: (msg: string, type?: "ok" | "err") => void;
  reload: () => void;
}) {
  const [bracket, setBracket] = useState<Record<SlotId, Team>>(loadBracket);
  const [dragging, setDragging] = useState<{ team: Team; from: SlotId | "pool" } | null>(null);
  const [dragOver, setDragOver] = useState<SlotId | null>(null);

  // All teams for the pool: all WC26 teams not yet placed in R32
  const placedCodes = new Set(
    Object.entries(bracket)
      .filter(([k]) => k.startsWith("r32_"))
      .map(([, t]) => t.code)
  );
  const pool = WC26_TEAMS.filter((t) => !placedCodes.has(t.code));

  const updateBracket = (next: Record<SlotId, Team>) => {
    setBracket(next);
    saveBracket(next);
  };

  const handleDrop = (slotId: SlotId) => {
    if (!dragging) return;
    const next = { ...bracket };

    // If dropping back onto the same slot, do nothing
    if (dragging.from === slotId) { setDragging(null); setDragOver(null); return; }

    // If slot already has a team, swap with source
    if (next[slotId] && dragging.from !== "pool") {
      const displaced = next[slotId];
      next[slotId] = dragging.team;
      next[dragging.from as SlotId] = displaced;
    } else {
      // Remove from old slot if it came from a slot
      if (dragging.from !== "pool") delete next[dragging.from as SlotId];
      next[slotId] = dragging.team;
    }

    updateBracket(next);
    setDragging(null);
    setDragOver(null);
  };

  const handleRemove = (slotId: SlotId) => {
    const next = { ...bracket };
    delete next[slotId];
    updateBracket(next);
  };

  const clearAll = () => {
    updateBracket({});
    showToast("Bracket cleared.", "ok");
  };
const saveToBackend = async () => {
  // Group flat slot ids (r32_0_a, r32_0_b, ...) into pairs by round index
  const pairs: Record<string, { a?: Team; b?: Team }> = {};
  for (const [slotId, team] of Object.entries(bracket)) {
    const m = slotId.match(/^(r32)_(\d+)_(a|b)$/);
    if (!m) continue; // only Round of 32 slots are pushed to backend for now
    const [, , idx, side] = m;
    const baseId = `r32_${idx}`;
    pairs[baseId] = pairs[baseId] || {};
    pairs[baseId][side as "a" | "b"] = team;
  }

  if (Object.keys(pairs).length === 0) {
    showToast("No Round of 32 slots filled in yet.", "err");
    return;
  }

  // Pull existing Round of 32 matches so we update real fixtures, not create new ones
  let r32Matches: ApiMatch[] = [];
  try {
    const allMatches = await adminApi.getAllMatches();
    r32Matches = allMatches.filter((m) => m.stage === "Round of 32");
  } catch (e: unknown) {
    showToast((e as Error).message ?? "Failed to load existing matches.", "err");
    return;
  }

  // Track which existing matches are still untouched (still TBD) so we can
  // match purely by position as a fallback for fixtures not in R32_SCHEDULE.
  const usedMatchIds = new Set<string>();
  let updated = 0;
  let skipped: string[] = [];

  try {
    for (const [baseId, { a, b }] of Object.entries(pairs)) {
      if (!a || !b) {
        skipped.push(`${baseId} (incomplete pair)`);
        continue;
      }

      // 1. Try to find the real fixture + kickoff time by team name
      const scheduleEntry = findScheduleEntry(a.name, b.name);

      // 2. Find an existing TBD match to update — prefer one already matching
      //    by date if we have a schedule entry, otherwise take the next
      //    unused "Round of 32" TBD row.
      let targetMatch: ApiMatch | undefined;

      if (scheduleEntry) {
        const targetIso = tunisiaToUtcIso(scheduleEntry.date, scheduleEntry.time);
        targetMatch = r32Matches.find(
          (m) =>
            !usedMatchIds.has(m.id) &&
            new Date(m.match_date).toISOString().slice(0, 10) === targetIso.slice(0, 10)
        );
      }

      // Fallback: any unused TBD-team match, in original order
      if (!targetMatch) {
        targetMatch = r32Matches.find(
          (m) => !usedMatchIds.has(m.id) && m.team_a.name === "TBD" && m.team_b.name === "TBD"
        );
      }

      if (!targetMatch) {
        skipped.push(`${a.name} vs ${b.name} (no available match slot found)`);
        continue;
      }

      usedMatchIds.add(targetMatch.id);

      await adminApi.updateMatch(targetMatch.id, {
        team_a_name: a.name,
        team_a_code: a.code,
        team_a_flag: a.flag,
        team_b_name: b.name,
        team_b_code: b.code,
        team_b_flag: b.flag,
        ...(scheduleEntry
          ? { match_date: tunisiaToUtcIso(scheduleEntry.date, scheduleEntry.time) }
          : {}),
      });

      updated++;
      console.log(
        `Updated ${targetMatch.id} (${baseId}) → ${a.name} vs ${b.name}` +
          (scheduleEntry ? ` @ ${scheduleEntry.date} ${scheduleEntry.time} (TN)` : " (date unchanged — not in schedule yet)")
      );
    }
  } catch (e: unknown) {
    showToast((e as Error).message ?? "Failed to save bracket.", "err");
    return;
  }

  if (skipped.length) {
    console.warn("Skipped:", skipped);
    showToast(`Saved ${updated} matches. ${skipped.length} skipped — see console.`, "err");
  } else {
    showToast(`✅ Saved ${updated} matches to backend.`, "ok");
  }

  reload();
};
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Instructions */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <p className="text-chalk-dim text-sm">
          Drag teams from the pool into bracket slots. Slots snap in place — drag between slots to swap.
        </p>
        <div className="flex gap-2">
          <button onClick={clearAll}
            className="px-4 py-2 rounded-lg border border-red-card/40 text-red-card text-sm hover:bg-red-card/10 transition">
            Clear all
          </button>
          <button onClick={saveToBackend}
            className="px-4 py-2 rounded-lg bg-crowd text-white text-sm font-bold hover:bg-crowd/80 transition">
            Save bracket
          </button>
        </div>
      </div>

      {/* Team pool */}
      <div className="mb-8">
        <h3 className="font-display text-xl tracking-wider text-chalk mb-3 uppercase">
          Team Pool <span className="text-chalk-dim text-base font-body normal-case">— drag into bracket slots</span>
        </h3>
        <div className="flex flex-wrap gap-2 p-4 rounded-2xl border border-dashed border-turf-line bg-turf-mid min-h-[60px]">
          {pool.length === 0 ? (
            <span className="text-chalk-dim text-sm self-center">All teams placed in Round of 32 ✅</span>
          ) : pool.map((team) => (
            <TeamChip
              key={team.code}
              team={team}
              dragging={dragging?.team.code === team.code && dragging.from === "pool"}
              onDragStart={() => setDragging({ team, from: "pool" })}
              onDragEnd={() => { if (dragging) setDragging(null); }}
            />
          ))}
        </div>
      </div>

      {/* Bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max items-start">
          {BRACKET_ROUNDS.map((round) => (
            <BracketColumn
              key={round.id}
              round={round}
              bracket={bracket}
              dragging={dragging}
              dragOver={dragOver}
              onDragStart={(team, slotId) => setDragging({ team, from: slotId })}
              onDragEnd={() => setDragging(null)}
              onDragOver={(slotId) => setDragOver(slotId)}
              onDragLeave={() => setDragOver(null)}
              onDrop={handleDrop}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Bracket Column ────────────────────────────────────────────────────────────

function BracketColumn({
  round,
  bracket,
  dragging,
  dragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
}: {
  round: { id: string; label: string; matches: number };
  bracket: Record<SlotId, Team>;
  dragging: { team: Team; from: SlotId | "pool" } | null;
  dragOver: SlotId | null;
  onDragStart: (team: Team, slotId: SlotId) => void;
  onDragEnd: () => void;
  onDragOver: (slotId: SlotId) => void;
  onDragLeave: () => void;
  onDrop: (slotId: SlotId) => void;
  onRemove: (slotId: SlotId) => void;
}) {
  return (
    <div className="flex flex-col gap-2" style={{ width: 160 }}>
      {/* Round label */}
      <div className="text-center mb-1">
        <span className="eyebrow text-crowd text-[10px]">{round.label}</span>
      </div>

      {/* Matches */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: round.matches }).map((_, i) => {
          const slotA: SlotId = `${round.id}_${i}_a`;
          const slotB: SlotId = `${round.id}_${i}_b`;
          return (
            <BracketMatch
              key={i}
              slotA={slotA}
              slotB={slotB}
              teamA={bracket[slotA]}
              teamB={bracket[slotB]}
              dragging={dragging}
              dragOver={dragOver}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onRemove={onRemove}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Bracket Match ─────────────────────────────────────────────────────────────

function BracketMatch({
  slotA, slotB, teamA, teamB,
  dragging, dragOver,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onRemove,
}: {
  slotA: SlotId; slotB: SlotId;
  teamA?: Team;  teamB?: Team;
  dragging: { team: Team; from: SlotId | "pool" } | null;
  dragOver: SlotId | null;
  onDragStart: (team: Team, slotId: SlotId) => void;
  onDragEnd: () => void;
  onDragOver: (slotId: SlotId) => void;
  onDragLeave: () => void;
  onDrop: (slotId: SlotId) => void;
  onRemove: (slotId: SlotId) => void;
}) {
  return (
    <div className="rounded-lg border border-turf-line bg-turf-mid overflow-hidden">
      <BracketSlot
        slotId={slotA} team={teamA}
        isOver={dragOver === slotA}
        dragging={dragging}
        onDragStart={onDragStart} onDragEnd={onDragEnd}
        onDragOver={onDragOver} onDragLeave={onDragLeave}
        onDrop={onDrop} onRemove={onRemove}
      />
      <div className="border-t border-turf-line/50" />
      <BracketSlot
        slotId={slotB} team={teamB}
        isOver={dragOver === slotB}
        dragging={dragging}
        onDragStart={onDragStart} onDragEnd={onDragEnd}
        onDragOver={onDragOver} onDragLeave={onDragLeave}
        onDrop={onDrop} onRemove={onRemove}
      />
    </div>
  );
}

// ── Bracket Slot ─────────────────────────────────────────────────────────────

function BracketSlot({
  slotId, team, isOver, dragging,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onRemove,
}: {
  slotId: SlotId; team?: Team; isOver: boolean;
  dragging: { team: Team; from: SlotId | "pool" } | null;
  onDragStart: (team: Team, slotId: SlotId) => void;
  onDragEnd: () => void;
  onDragOver: (slotId: SlotId) => void;
  onDragLeave: () => void;
  onDrop: (slotId: SlotId) => void;
  onRemove: (slotId: SlotId) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onDragOver={(e) => { e.preventDefault(); onDragOver(slotId); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(slotId); }}
      className={`h-9 flex items-center px-2 gap-1.5 transition group cursor-default
        ${isOver && dragging ? "bg-crowd/20 border-l-2 border-crowd" : ""}
        ${!team && !isOver ? "bg-turf-deep/40" : ""}
      `}
    >
      {team ? (
        <>
          <span
            draggable
            onDragStart={() => onDragStart(team, slotId)}
            onDragEnd={onDragEnd}
            className="flex items-center gap-1.5 flex-1 cursor-grab active:cursor-grabbing min-w-0"
          >
            <span className="text-base shrink-0">{team.flag}</span>
            <span className="font-body text-xs text-chalk truncate">{team.name}</span>
          </span>
          <button
            onClick={() => onRemove(slotId)}
            className="opacity-0 group-hover:opacity-100 text-chalk-dim hover:text-red-card transition text-xs shrink-0"
          >✕</button>
        </>
      ) : (
        <span className="text-chalk-dim/40 text-xs italic">
          {isOver ? "Drop here" : "TBD"}
        </span>
      )}
    </div>
  );
}

// ── Team Chip (pool) ──────────────────────────────────────────────────────────

function TeamChip({
  team, dragging, onDragStart, onDragEnd,
}: {
  team: Team;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-turf-line bg-turf-deep cursor-grab active:cursor-grabbing select-none transition
        ${dragging ? "opacity-40 scale-95" : "hover:border-crowd hover:bg-crowd/10"}`}
    >
      <span className="text-base">{team.flag}</span>
      <span className="text-xs text-chalk font-medium">{team.name}</span>
    </div>
  );
}