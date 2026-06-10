from fastapi import APIRouter
from database import supabase

router = APIRouter(prefix="/ranking", tags=["ranking"])


@router.get("/")
def get_leaderboard():
    """
    Returns the full leaderboard using the Supabase view.
    Sorted by: total_pts DESC → exact DESC → correct DESC → username ASC
    """
    result = (
        supabase.table("leaderboard")
        .select("*")
        .order("rank")
        .execute()
    )
    return result.data


@router.get("/me/{user_id}")
def get_my_rank(user_id: str):
    """Returns a single user's ranking row."""
    result = (
        supabase.table("leaderboard")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return result.data