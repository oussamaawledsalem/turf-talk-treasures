import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Prediction } from "./scoring";
import { useAuth } from "./auth-context";

type PredictionsState = {
  predictions: Record<string, Prediction>;
  setPrediction: (matchId: string, scoreA: number, scoreB: number) => void;
  removePrediction: (matchId: string) => void;
  getAllForUser: (username: string) => Record<string, Prediction>;
};

const PredictionsCtx = createContext<PredictionsState | null>(null);

function keyFor(username: string) {
  return `wc26_predictions_${username}`;
}

function readPreds(username: string): Record<string, Prediction> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(keyFor(username)) || "{}");
  } catch {
    return {};
  }
}

export function PredictionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});

  useEffect(() => {
    if (!user) {
      setPredictions({});
      return;
    }
    setPredictions(readPreds(user.username));
  }, [user]);

  const setPrediction = useCallback(
    (matchId: string, scoreA: number, scoreB: number) => {
      if (!user) return;
      setPredictions((prev) => {
        const next = { ...prev, [matchId]: { scoreA, scoreB, lockedAt: Date.now() } };
        window.localStorage.setItem(keyFor(user.username), JSON.stringify(next));
        return next;
      });
    },
    [user],
  );

  const removePrediction = useCallback(
    (matchId: string) => {
      if (!user) return;
      setPredictions((prev) => {
        const next = { ...prev };
        delete next[matchId];
        window.localStorage.setItem(keyFor(user.username), JSON.stringify(next));
        return next;
      });
    },
    [user],
  );

  const getAllForUser = (username: string) => readPreds(username);

  return (
    <PredictionsCtx.Provider
      value={{ predictions, setPrediction, removePrediction, getAllForUser }}
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