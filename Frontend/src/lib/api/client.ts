const BASE = "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("wc26_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  avatar: string;
};

export const authApi = {
  register: (username: string, password: string, avatar: string) =>
    request<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, avatar }),
    }),

  login: (username: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};

// ── Matches ───────────────────────────────────────────────────────────────────

export type ApiMatch = {
  id: string;
  api_id: number;
  match_date: string;
  stage: string;
  team_a: { name: string; code: string; flag: string };
  team_b: { name: string; code: string; flag: string };
  venue: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
};

export const matchesApi = {
  getAll: (stage?: string, search?: string) => {
    const params = new URLSearchParams();
    if (stage) params.set("stage", stage);
    if (search) params.set("search", search);
    const qs = params.toString();
    return request<ApiMatch[]>(`/matches/${qs ? `?${qs}` : ""}`);
  },
};

// ── Predictions ───────────────────────────────────────────────────────────────

export type ApiPrediction = {
  id: string;
  match_id: string;
  score_a: number;
  score_b: number;
  locked_at: string;
  points: number | null;
};

export const predictionsApi = {
  getAll: () => request<ApiPrediction[]>("/predictions/"),

  create: (match_id: string, score_a: number, score_b: number) =>
    request<ApiPrediction>("/predictions/", {
      method: "POST",
      body: JSON.stringify({ match_id, score_a, score_b }),
    }),

  update: (prediction_id: string, score_a: number, score_b: number) =>
    request<ApiPrediction>(`/predictions/${prediction_id}`, {
      method: "PUT",
      body: JSON.stringify({ score_a, score_b }),
    }),

  delete: (prediction_id: string) =>
    request<void>(`/predictions/${prediction_id}`, { method: "DELETE" }),
};

// ── Ranking ───────────────────────────────────────────────────────────────────

export type RankingRow = {
  rank: number;
  user_id: string;
  username: string;
  avatar: string;
  predicted: number;
  exact: number;
  correct: number;
  total_pts: number;
};

export const rankingApi = {
  getAll: () => request<RankingRow[]>("/ranking/"),
};