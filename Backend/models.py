from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ─── AUTH ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    password: str
    avatar: str = "⚽"

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    avatar: str
    is_admin: bool = False


# ─── MATCHES ─────────────────────────────────────────────────────────────────

class TeamInfo(BaseModel):
    name: str
    code: str
    flag: str

class MatchOut(BaseModel):
    id: str
    api_id: int
    match_date: datetime
    stage: str
    team_a: TeamInfo
    team_b: TeamInfo
    venue: Optional[str]
    score_a: Optional[int]
    score_b: Optional[int]
    status: str


# ─── PREDICTIONS ─────────────────────────────────────────────────────────────

class PredictionCreate(BaseModel):
    match_id: str
    score_a: int
    score_b: int

class PredictionUpdate(BaseModel):
    score_a: int
    score_b: int

class PredictionOut(BaseModel):
    id: str
    match_id: str
    score_a: int
    score_b: int
    locked_at: datetime
    points: Optional[int]


# ─── RANKING ─────────────────────────────────────────────────────────────────

class RankingRow(BaseModel):
    rank: int
    user_id: str
    username: str
    avatar: str
    predicted: int
    exact: int
    correct: int
    total_pts: int