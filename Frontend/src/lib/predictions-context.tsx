import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { predictionsApi, type ApiPrediction } from "./api/client";
import { useAuth } from "./auth-context";
import type { Prediction } from "./scoring";

type PredictionsState = {
  // map of match_id → prediction (for the logged-in user)
  predictions: Record<string, Prediction & { _id: string }>;
  setPrediction: (matchId: string, scoreA: number, scoreB: number) => Promise<void>;
  removePrediction: (matchId: string) => Promise<void>;
  loading: boolean;
};

const PredictionsCtx = createContext<PredictionsState | null>(null);

function toPrediction(p: ApiPrediction): Prediction & { _id: string } {
  return {
    _id: p.id,
    scoreA: p.score_a,
    scoreB: p.score_b,
    lockedAt: new Date(p.locked_at).getTime(),
    points: p.points,
  };
}

export function PredictionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<
    Record<string, Prediction & { _id: string }>
  >({});
  const [loading, setLoading] = useState(false);

  // Load predictions whenever user changes
  useEffect(() => {
    if (!user) {
      setPredictions({});
      return;
    }
    setLoading(true);
    predictionsApi
      .getAll()
      .then((list) => {
        const map: Record<string, Prediction & { _id: string }> = {};
        for (const p of list) {
          map[p.match_id] = toPrediction(p);
        }
        setPredictions(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const setPrediction = useCallback(
    async (matchId: string, scoreA: number, scoreB: number) => {
      if (!user) return;
      const existing = predictions[matchId];
      try {
        if (existing) {
          // Update
          const updated = await predictionsApi.update(existing._id, scoreA, scoreB);
          setPredictions((prev) => ({
            ...prev,
            [matchId]: toPrediction(updated),
          }));
        } else {
          // Create
          const created = await predictionsApi.create(matchId, scoreA, scoreB);
          setPredictions((prev) => ({
            ...prev,
            [matchId]: toPrediction(created),
          }));
        }
      } catch (e) {
        console.error("Failed to save prediction:", e);
        throw e;
      }
    },
    [user, predictions],
  );

  const removePrediction = useCallback(
    async (matchId: string) => {
      if (!user) return;
      const existing = predictions[matchId];
      if (!existing) return;
      try {
        await predictionsApi.delete(existing._id);
        setPredictions((prev) => {
          const next = { ...prev };
          delete next[matchId];
          return next;
        });
      } catch (e) {
        console.error("Failed to remove prediction:", e);
        throw e;
      }
    },
    [user, predictions],
  );

  return (
    <PredictionsCtx.Provider
      value={{ predictions, setPrediction, removePrediction, loading }}
    >
      {children}
    </PredictionsCtx.Provider>
  );
}

export function usePredictions() {
  const ctx = useContext(PredictionsCtx);
  if (!ctx) throw new Error("usePredictions outside provider");
  return ctx;
}