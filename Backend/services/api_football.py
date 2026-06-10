import json
import os
from datetime import datetime, timezone
from database import supabase

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEDULE_PATH = os.path.join(BASE_DIR, "wc2026_schedule.json")


async def fetch_and_cache_matches() -> list[dict]:
    with open(SCHEDULE_PATH, "r", encoding="utf-8") as f:
        fixtures = json.load(f)

    rows = []
    for f in fixtures:
        rows.append({
            "api_id":      f["id"],
            "match_date":  f["match_date"],
            "stage":       f["stage"],
            "team_a_name": f["team_a_name"],
            "team_a_code": f["team_a_code"],
            "team_a_flag": f["team_a_flag"],
            "team_b_name": f["team_b_name"],
            "team_b_code": f["team_b_code"],
            "team_b_flag": f["team_b_flag"],
            "venue":       f.get("venue"),
            "score_a":     f.get("score_a"),
            "score_b":     f.get("score_b"),
            "status":      f.get("status", "NS"),
            "last_synced": datetime.now(timezone.utc).isoformat(),
        })

    supabase.table("matches").upsert(rows, on_conflict="api_id").execute()
    return rows


async def sync_live_scores():
    return []