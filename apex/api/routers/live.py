"""Live (Sofascore WC 2026) read routes."""
from fastapi import APIRouter, Depends
from ..db import get_db
from .. import queries

router = APIRouter(prefix="/api/live", tags=["live"])

@router.get("/matches")
def get_live_matches(con=Depends(get_db)):
    return queries.live_matches(con)

@router.get("/fixtures")
def get_fixtures(con=Depends(get_db)):
    return queries.fixtures(con)

@router.get("/standings")
def get_live_standings(con=Depends(get_db)):
    return queries.live_standings(con)
