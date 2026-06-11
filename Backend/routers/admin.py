from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import supabase
from security import get_admin_user
from services.scoring import calculate_points

router = APIRouter(prefix="/admin", tags=["admin"])


class ScoreUpdate(BaseModel):
    score_a: int
    score_b: int


class MatchUpdate(BaseModel):
    score_a: Optional[int] = None
    score_b: Optional[int] = None
    status: Optional[str] = None
    team_a_name: Optional[str] = None
    team_b_name: Optional[str] = None
    team_a_code: Optional[str] = None
    team_b_code: Optional[str] = None
    team_a_flag: Optional[str] = None
    team_b_flag: Optional[str] = None


@router.get("/matches")
def get_all_matches_admin(_: dict = Depends(get_admin_user)):
    """Get all matches with full details for admin panel."""
    result = (
        supabase.table("matches")
        .select("*")
        .order("match_date")
        .execute()
    )
    return result.data


@router.patch("/matches/{match_id}/score")
def set_match_score(
    match_id: str,
    body: ScoreUpdate,
    _: dict = Depends(get_admin_user),
):
    """
    Set the final score for a match and auto-score all predictions.
    Use the match UUID (id field, not api_id).
    """
    # Update match score and mark as finished
    supabase.table("matches").update({
        "score_a": body.score_a,
        "score_b": body.score_b,
        "status":  "FT",
    }).eq("id", match_id).execute()

    # Auto-score all predictions for this match
    preds = (
        supabase.table("predictions")
        .select("id, score_a, score_b")
        .eq("match_id", match_id)
        .execute()
    )

    scored = 0
    for pred in preds.data:
        pts = calculate_points(
            pred["score_a"], pred["score_b"],
            body.score_a, body.score_b,
        )
        supabase.table("predictions").update({"points": pts}).eq("id", pred["id"]).execute()
        scored += 1

    return {
        "match_id": match_id,
        "score":    f"{body.score_a}–{body.score_b}",
        "predictions_scored": scored,
        "message": f"✅ Score set and {scored} predictions scored",
    }


@router.patch("/matches/{match_id}")
def update_match(
    match_id: str,
    body: MatchUpdate,
    _: dict = Depends(get_admin_user),
):
    """Update any match field — used to fill in TBD teams for knockout rounds."""
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    supabase.table("matches").update(updates).eq("id", match_id).execute()
    return {"match_id": match_id, "updated": updates}


@router.get("/stats")
def get_stats(_: dict = Depends(get_admin_user)):
    """Quick overview for the admin panel."""
    matches = supabase.table("matches").select("id, status, score_a", count="exact").execute()
    predictions = supabase.table("predictions").select("id", count="exact").execute()
    users = supabase.table("users").select("id", count="exact").execute()

    finished = sum(1 for m in matches.data if m["status"] == "FT")
    pending = sum(1 for m in matches.data if m["score_a"] is None)

    return {
        "total_matches":     matches.count,
        "finished_matches":  finished,
        "pending_matches":   pending,
        "total_predictions": predictions.count,
        "total_users":       users.count,
    }