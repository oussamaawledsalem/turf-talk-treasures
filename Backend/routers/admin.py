from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import supabase
from security import get_admin_user
from services.scoring import calculate_points
from routers.matches import _format_match

router = APIRouter(prefix="/admin", tags=["admin"])


class ScoreUpdate(BaseModel):
    score_a: int
    score_b: int


class MatchUpdate(BaseModel):
    score_a: Optional[int] = None
    score_b: Optional[int] = None
    status: Optional[str] = None
    match_date: Optional[str] = None
    team_a_name: Optional[str] = None
    team_b_name: Optional[str] = None
    team_a_code: Optional[str] = None
    team_b_code: Optional[str] = None
    team_a_flag: Optional[str] = None
    team_b_flag: Optional[str] = None


class CreateMatchBody(BaseModel):
    stage: str
    match_date: str
    team_a: dict
    team_b: dict
    venue: Optional[str] = None


@router.get("/matches")
def get_all_matches_admin(_: dict = Depends(get_admin_user)):
    """Get all matches with full details for admin panel."""
    result = (
        supabase.table("matches")
        .select("*")
        .order("match_date")
        .execute()
    )
    return [_format_match(row) for row in result.data]


@router.post("/matches")
def create_knockout_match(
    body: CreateMatchBody,
    _: dict = Depends(get_admin_user),
):
    """Create a new knockout match manually (teams known after group stage)."""
    row = {
        "stage":       body.stage,
        "match_date":  body.match_date,
        "team_a_name": body.team_a.get("name"),
        "team_a_code": body.team_a.get("code"),
        "team_a_flag": body.team_a.get("flag"),
        "team_b_name": body.team_b.get("name"),
        "team_b_code": body.team_b.get("code"),
        "team_b_flag": body.team_b.get("flag"),
        "venue":       body.venue,
        "status":      "NS",
        "score_a":     None,
        "score_b":     None,
        "api_id":      None,
    }
    result = supabase.table("matches").insert(row).execute()
    return _format_match(result.data[0])


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
    supabase.table("matches").update({
        "score_a": body.score_a,
        "score_b": body.score_b,
        "status":  "FT",
    }).eq("id", match_id).execute()

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


@router.delete("/matches/{match_id}", status_code=204)
def delete_match(
    match_id: str,
    _: dict = Depends(get_admin_user),
):
    """Delete a knockout match and its predictions."""
    supabase.table("predictions").delete().eq("match_id", match_id).execute()
    supabase.table("matches").delete().eq("id", match_id).execute()


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