from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone, timedelta
from models import PredictionCreate
from security import get_current_user
from database import supabase
from services.scoring import calculate_points

router = APIRouter(prefix="/predictions", tags=["predictions"])

CANCEL_WINDOW_SECONDS = 5


def _is_match_started(match_date: str) -> bool:
    kickoff = datetime.fromisoformat(match_date.replace("Z", "+00:00"))
    return datetime.now(timezone.utc) >= kickoff


def _is_cancel_window_open(locked_at: str) -> bool:
    locked = datetime.fromisoformat(locked_at.replace("Z", "+00:00"))
    return datetime.now(timezone.utc) <= locked + timedelta(seconds=CANCEL_WINDOW_SECONDS)


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


@router.get("/user/{username}")
def get_user_predictions(username: str, current_user: dict = Depends(get_current_user)):
    """
    Return predictions for a given user.
    Each prediction is only visible if the requesting user has also predicted that match.
    Predictions within the 5-second cancel window are hidden (not yet confirmed).
    """
    # Get target user
    target = (
        supabase.table("users")
        .select("id, username, avatar")
        .eq("username", username)
        .execute()
    )
    if not target.data:
        raise HTTPException(status_code=404, detail="User not found")
    target.data = target.data[0]

    target_id = target.data["id"]
    viewer_id = current_user["sub"]

    # Self: return all own predictions
    if target_id == viewer_id:
        result = (
            supabase.table("predictions")
            .select("*, matches(match_date, team_a_name, team_b_name, score_a, score_b, status, stage)")
            .eq("user_id", target_id)
            .execute()
        )
        return {"user": target.data, "predictions": result.data, "restricted": False}

    # Get viewer's confirmed predictions (outside cancel window)
    viewer_preds = (
        supabase.table("predictions")
        .select("match_id, locked_at")
        .eq("user_id", viewer_id)
        .execute()
    )
    # Only confirmed predictions unlock visibility
    viewer_match_ids = {
        p["match_id"] for p in viewer_preds.data
        if not _is_cancel_window_open(p["locked_at"])
    }

    # Get target's predictions
    target_preds = (
        supabase.table("predictions")
        .select("*, matches(match_date, team_a_name, team_b_name, score_a, score_b, status, stage, team_a_flag, team_b_flag)")
        .eq("user_id", target_id)
        .execute()
    )

    # Filter: only show if viewer has also predicted that match
    visible = [p for p in target_preds.data if p["match_id"] in viewer_match_ids]
    hidden_count = len(target_preds.data) - len(visible)

    return {
        "user": target.data,
        "predictions": visible,
        "hidden_count": hidden_count,
        "restricted": True,
    }


@router.post("/", status_code=201)
def create_prediction(
    body: PredictionCreate,
    current_user: dict = Depends(get_current_user),
):
    # Verify match exists
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

    if _is_match_started(match["match_date"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Prediction window closed — match has started"
        )

    # No duplicates — predictions are permanent
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
            detail="Prediction already locked — cannot be changed"
        )

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


@router.delete("/{prediction_id}", status_code=204)
def cancel_prediction(
    prediction_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Cancel a prediction — only allowed within 5 seconds of locking.
    """
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

    if not _is_cancel_window_open(prediction["locked_at"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cancel window expired — prediction is permanent"
        )

    supabase.table("predictions").delete().eq("id", prediction_id).execute()


@router.post("/score-all", tags=["admin"])
def score_all_predictions():
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
    return {"updated": updated}