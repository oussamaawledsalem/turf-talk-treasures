import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Lock, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MatchViewModel } from "@/routes/schedule";
import { usePredictions } from "@/lib/predictions-context";
import { calculatePoints, matchHasStarted } from "@/lib/scoring";
import { ScoreInput } from "./ScoreInput";

export function MatchCard({ match }: { match: MatchViewModel }) {
  const { predictions, setPrediction, removePrediction } = usePredictions();
  const existing = predictions[match.id];
  const started = matchHasStarted(match.date);
  const hasResult = !!match.result;

  const [scoreA, setScoreA] = useState(existing?.scoreA ?? 0);
  const [scoreB, setScoreB] = useState(existing?.scoreB ?? 0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 5-second cancel countdown
  const [cancelSecondsLeft, setCancelSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!existing) { setCancelSecondsLeft(null); return; }
    const lockedAt = existing.lockedAt;
    const deadline = lockedAt + 5000;
    const remaining = deadline - Date.now();
    if (remaining <= 0) { setCancelSecondsLeft(null); return; }

    setCancelSecondsLeft(Math.ceil(remaining / 1000));
    const interval = setInterval(() => {
      const left = Math.ceil((deadline - Date.now()) / 1000);
      if (left <= 0) { setCancelSecondsLeft(null); clearInterval(interval); }
      else setCancelSecondsLeft(left);
    }, 200);
    return () => clearInterval(interval);
  }, [existing?.lockedAt]);

  const points = calculatePoints(existing, match.result);

  const lock = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await setPrediction(match.id, scoreA, scoreB);
    } catch {
      setSaveError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    try {
      await removePrediction(match.id);
    } catch {
      setSaveError("Cancel failed — window may have expired.");
    }
  };

  let borderClass = "border-turf-line";
  if (hasResult && points === 3) borderClass = "border-l-[3px] border-l-gold border-turf-line";
  else if (hasResult && points === 0) borderClass = "border-l-[3px] border-l-red-card border-turf-line";
  else if (existing) borderClass = "border-l-[3px] border-l-gold border-turf-line";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border ${borderClass} bg-turf-mid overflow-hidden`}
    >
      <div className="pitch-stripes absolute inset-0 opacity-30 pointer-events-none" />
      <div className="relative p-5">
        {/* Eyebrow */}
        <div className="eyebrow flex flex-wrap gap-x-3 gap-y-1 items-center">
          <span className="text-gold">{match.stage.toUpperCase()}</span>
          <span>·</span>
          <span>{format(new Date(match.date), "EEE MMM d, HH:mm")}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" /> {match.venue}
          </span>
        </div>

        {/* Teams */}
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl leading-none">{match.teamA.flag}</div>
            <div className="mt-2 font-display text-2xl text-chalk">{match.teamA.name}</div>
          </div>
          <div className="font-display text-3xl text-chalk-dim">VS</div>
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl leading-none">{match.teamB.flag}</div>
            <div className="mt-2 font-display text-2xl text-chalk">{match.teamB.name}</div>
          </div>
        </div>

        {/* Prediction area */}
        <div className="mt-5 rounded-xl border border-turf-line bg-turf-deep/70 p-4">
          {hasResult ? (
            <ResultRow prediction={existing} result={match.result!} points={points} />
          ) : started ? (
            <div className="text-center text-chalk-dim text-sm py-2">
              ⏱ Prediction window closed
              {existing && (
                <div className="mt-2 text-chalk font-scoreboard text-2xl">
                  Your pick: {existing.scoreA} – {existing.scoreB}
                </div>
              )}
            </div>
          ) : existing ? (
            // Locked — show prediction + optional cancel countdown
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="eyebrow">Your pick (locked 🔒)</div>
                  <div className="font-scoreboard text-3xl text-chalk">
                    {match.teamA.name} {existing.scoreA} – {existing.scoreB} {match.teamB.name}
                  </div>
                </div>
              </div>
              {/* 5-second cancel window */}
              {cancelSecondsLeft !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1 h-1 rounded-full bg-turf-line overflow-hidden">
                    <motion.div
                      className="h-full bg-gold rounded-full"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 5, ease: "linear" }}
                    />
                  </div>
                  <button
                    onClick={cancel}
                    className="px-3 py-1.5 rounded-lg border border-red-card text-red-card text-sm hover:bg-red-card/10 transition"
                  >
                    Cancel ({cancelSecondsLeft}s)
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            // No prediction yet
            <div className="flex flex-col items-center gap-4">
              <div className="eyebrow">Your prediction</div>
              <div className="flex items-center gap-4">
                <ScoreInput value={scoreA} onChange={setScoreA} />
                <span className="font-display text-2xl text-chalk-dim">—</span>
                <ScoreInput value={scoreB} onChange={setScoreB} />
              </div>
              {saveError && <div className="text-red-card text-sm">{saveError}</div>}
              <button
                onClick={lock}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 font-display text-xl tracking-wider text-turf-deep hover:bg-floodlight transition disabled:opacity-60"
              >
                <Lock className="size-4" />
                {saving ? "Saving..." : "Lock in prediction"}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ResultRow({
  prediction,
  result,
  points,
}: {
  prediction: { scoreA: number; scoreB: number } | undefined;
  result: { scoreA: number; scoreB: number };
  points: number | null;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center text-center">
      <div>
        <div className="eyebrow">Your pick</div>
        <div className="font-scoreboard text-3xl text-chalk">
          {prediction ? `${prediction.scoreA}–${prediction.scoreB}` : "—"}
        </div>
      </div>
      <div>
        <div className="eyebrow">Final</div>
        <div className="font-scoreboard text-3xl text-floodlight">
          {result.scoreA}–{result.scoreB}
        </div>
      </div>
      <div>
        <div className="eyebrow">Points</div>
        <div className={`font-scoreboard text-3xl ${
          points === 3 ? "text-gold" : points === 1 ? "text-sky" : points === 0 ? "text-red-card" : "text-chalk-dim"
        }`}>
          {points === null ? "—" : points === 3 ? "+3 🎉" : points === 1 ? "+1 ✅" : "0 ❌"}
        </div>
      </div>
    </div>
  );
}