import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from routers import auth, matches, predictions, ranking, admin
from services.api_football import fetch_and_cache_matches

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from database import supabase
    result = supabase.table("matches").select("id", count="exact").execute()
    count = result.count or 0
    if count == 0:
        print("📡 No matches in DB — fetching from static schedule...")
        rows = await fetch_and_cache_matches()
        print(f"✅ Cached {len(rows)} matches")
    else:
        print(f"✅ {count} matches already cached")
    yield


app = FastAPI(
    title="KICKOFF API",
    description="World Cup 2026 Prediction Game Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(matches.router)
app.include_router(predictions.router)
app.include_router(ranking.router)
app.include_router(admin.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "⚽ KICKOFF API is live", "version": "1.0.0"}

@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}