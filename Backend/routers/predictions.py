from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from models import PredictionCreate, PredictionUpdate
from security import get_current_user
from database import supabase
from services.scoring import calculate_points

router = APIRouter(prefix="/predictions", tags=["predictions"])


def _is_match_locked(match_date: str) -> bool:
    """Predictions lock when the match kicks off."""
    kickoff = datetime.fromisoformat(match_date.replace("Z", "+00:00"))
    return datetime.now(timezone.utc) >= kickoff


@router.get("/")
def get_my_predictions(current_user: dict = Depends(get_current_user)):
    """Return all predictions for the logged-in user."""
    result = (
        supabase.table("predictions")
        .select("*, matches(match_date, team_a_name, team_b_name, score_a, score_b, status, stage)")
        .eq("user_id", current_user["sub"])
        .execute()
    )
    return result.data


@router.post("/", status_code=201)
def create_prediction(
    body: PredictionCreate,
    current_user: dict = Depends(get_current_user),
):
    # Verify match exists and is not locked
    match_result = (
        supabase.table("matches")
        .select("id, match_date, score_a, score_b")
        .eq("id", body.match_id)
        .single()
        .execute()
    )
    match = match_result.data
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if _is_match_locked(match["match_date"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Prediction window closed — match has started"
        )

    # Check for duplicate
    existing = (
        supabase.table("predictions")
        .select("id")
        .eq("user_id", current_user["sub"])
        .eq("match_id", body.match_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Prediction already exists — use PUT to update"
        )

    # Calculate points if result already available
    points = None
    if match["score_a"] is not None and match["score_b"] is not None:
        points = calculate_points(body.score_a, body.score_b, match["score_a"], match["score_b"])

    result = (
        supabase.table("predictions")
        .insert({
            "user_id":  current_user["sub"],
            "match_id": body.match_id,
            "score_a":  body.score_a,
            "score_b":  body.score_b,
            "points":   points,
        })
        .execute()
    )
    return result.data[0]


@router.put("/{prediction_id}")
def update_prediction(
    prediction_id: str,
    body: PredictionUpdate,
    current_user: dict = Depends(get_current_user),
):
    # Verify ownership
    pred_result = (
        supabase.table("predictions")
        .select("*, matches(match_date, score_a, score_b)")
        .eq("id", prediction_id)
        .eq("user_id", current_user["sub"])
        .single()
        .execute()
    )
    prediction = pred_result.data
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    match = prediction["matches"]
    if _is_match_locked(match["match_date"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot edit — match has started"
        )

    result = (
        supabase.table("predictions")
        .update({
            "score_a":   body.score_a,
            "score_b":   body.score_b,
            "locked_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", prediction_id)
        .execute()
    )
    return result.data[0]


@router.delete("/{prediction_id}", status_code=204)
def delete_prediction(
    prediction_id: str,
    current_user: dict = Depends(get_current_user),
):
    pred_result = (
        supabase.table("predictions")
        .select("*, matches(match_date)")
        .eq("id", prediction_id)
        .eq("user_id", current_user["sub"])
        .single()
        .execute()
    )
    prediction = pred_result.data
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    if _is_match_locked(prediction["matches"]["match_date"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete — match has started"
        )

    supabase.table("predictions").delete().eq("id", prediction_id).execute()


@router.post("/score-all", tags=["admin"])
def score_all_predictions():
    """
    Admin endpoint: recalculate points for all finished matches.
    Run after each match result is confirmed.
    """
    # Get all finished matches with results
    matches = (
        supabase.table("matches")
        .select("id, score_a, score_b")
        .eq("status", "FT")
        .not_.is_("score_a", "null")
        .execute()
    )

    updated = 0
    for match in matches.data:
        preds = (
            supabase.table("predictions")
            .select("id, score_a, score_b")
            .eq("match_id", match["id"])
            .execute()
        )
        for pred in preds.data:
            pts = calculate_points(
                pred["score_a"], pred["score_b"],
                match["score_a"], match["score_b"]
            )
            supabase.table("predictions").update({"points": pts}).eq("id", pred["id"]).execute()
            updated += 1

    return {"updated": updated, "message": f"Scored {updated} predictions"}