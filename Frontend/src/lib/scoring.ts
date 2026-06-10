// Prediction type — now includes optional points from backend
export type Prediction = {
  scoreA: number;
  scoreB: number;
  lockedAt: number;
  points?: number | null;
};

export function calculatePoints(
  prediction: Prediction | undefined | null,
  result: { scoreA: number; scoreB: number } | null | undefined,
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

export function matchHasStarted(matchDate: string): boolean {
  return new Date(matchDate).getTime() <= Date.now();
}