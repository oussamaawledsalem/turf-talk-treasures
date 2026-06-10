from fastapi import APIRouter, Query, BackgroundTasks
from typing import Optional
from database import supabase
from services.api_football import fetch_and_cache_matches, sync_live_scores

router = APIRouter(prefix="/matches", tags=["matches"])


def _format_match(row: dict) -> dict:
    return {
        "id":         row["id"],
        "api_id":     row["api_id"],
        "match_date": row["match_date"],
        "stage":      row["stage"],
        "team_a": {
            "name": row["team_a_name"],
            "code": row["team_a_code"],
            "flag": row["team_a_flag"],
        },
        "team_b": {
            "name": row["team_b_name"],
            "code": row["team_b_code"],
            "flag": row["team_b_flag"],
        },
        "venue":   row.get("venue"),
        "score_a": row.get("score_a"),
        "score_b": row.get("score_b"),
        "status":  row.get("status", "NS"),
    }


@router.get("/")
async def get_matches(
    background_tasks: BackgroundTasks,
    stage: Optional[str] = Query(None, description="Filter by stage"),
    search: Optional[str] = Query(None, description="Search by team name"),
):
    """
    Returns all WC2026 matches from Supabase cache.
    Triggers a background live-score sync for matches happening now.
    """
    # Background sync for live matches (doesn't block the response)
    background_tasks.add_task(sync_live_scores)

    query = supabase.table("matches").select("*").order("match_date")

    if stage:
        query = query.ilike("stage", f"%{stage}%")

    if search:
        # Search in both team names
        query = query.or_(
            f"team_a_name.ilike.%{search}%,team_b_name.ilike.%{search}%"
        )

    result = query.execute()
    return [_format_match(row) for row in result.data]


@router.get("/{match_id}")
def get_match(match_id: str):
    result = (
        supabase.table("matches")
        .select("*")
        .eq("id", match_id)
        .single()
        .execute()
    )
    return _format_match(result.data)


@router.post("/sync", tags=["admin"])
async def force_sync():
    """
    Admin endpoint: force a full re-fetch from API-Football.
    Use sparingly — costs API quota.
    """
    rows = await fetch_and_cache_matches()
    return {"synced": len(rows), "message": "Matches synced from API-Football"}