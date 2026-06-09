import type { Match, MatchResult } from "./schedule-data";

export type Prediction = { scoreA: number; scoreB: number; lockedAt: number };

export function calculatePoints(
  prediction: Prediction | undefined | null,
  result: MatchResult,
): number | null {
  if (!result || !prediction) return null;
  if (prediction.scoreA === result.scoreA && prediction.scoreB === result.scoreB) return 3;
  const p = Math.sign(prediction.scoreA - prediction.scoreB);
  const r = Math.sign(result.scoreA - result.scoreB);
  if (p === r) return 1;
  return 0;
}

export type UserStats = {
  username: string;
  avatar: string;
  predicted: number;
  exact: number;
  correct: number;
  points: number;
};

export function computeStats(
  username: string,
  avatar: string,
  predictions: Record<string, Prediction>,
  matches: Match[],
): UserStats {
  let exact = 0;
  let correct = 0;
  let points = 0;
  let predicted = 0;
  for (const m of matches) {
    const p = predictions[m.id];
    if (p) predicted++;
    const pts = calculatePoints(p, m.result);
    if (pts === null) continue;
    if (pts === 3) exact++;
    else if (pts === 1) correct++;
    points += pts;
  }
  return { username, avatar, predicted, exact, correct, points };
}

export function matchHasStarted(m: Match): boolean {
  return new Date(m.date).getTime() <= Date.now();
}