"""Live (Sofascore WC 2026) read routes."""
import subprocess
import sys
from pathlib import Path
from fastapi import APIRouter, Depends
from ..db import get_db
from .. import queries

router = APIRouter(prefix="/api/live", tags=["live"])

# Repo root (apex/api/routers/live.py -> parents[3]); config paths are relative to it.
_ROOT = Path(__file__).resolve().parents[3]

@router.post("/refresh")
def refresh_live():
    """Trigger the speed layer to fetch the latest scores and rebuild the WC
    tables. Runs in a subprocess (separate DuckDB write connection); on a failed
    live scrape the pipeline falls back to the last-good snapshot."""
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "apex.live.cli", "refresh"],
            cwd=str(_ROOT), capture_output=True, text=True, timeout=90,
        )
        return {"ok": proc.returncode == 0, "log": (proc.stderr or proc.stdout)[-400:]}
    except Exception as e:  # subprocess failure / timeout — report, don't crash the API
        return {"ok": False, "error": str(e)}

@router.get("/matches")
def get_live_matches(con=Depends(get_db)):
    return queries.live_matches(con)

@router.get("/fixtures")
def get_fixtures(con=Depends(get_db)):
    return queries.fixtures(con)

@router.get("/standings")
def get_live_standings(con=Depends(get_db)):
    return queries.live_standings(con)

@router.get("/knockout")
def get_knockout(con=Depends(get_db)):
    return queries.knockout(con)
