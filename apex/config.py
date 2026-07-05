"""Central config: dataset ids, paths, thresholds, position mapping."""
from pathlib import Path

COMPETITION_ID = 11          # La Liga
SEASON_ID = 27               # 2015/16 — the full, all-20-clubs season
SEASON_LABEL = "2015/2016"

DATA_DIR = Path("data")
RAW_DIR = DATA_DIR / "raw"
RAW_EVENTS_DIR = RAW_DIR / "events"
MATCHES_PARQUET = RAW_DIR / "matches.parquet"
PROCESSED_DIR = DATA_DIR / "processed"
EVENTS_MASTER = PROCESSED_DIR / "events.parquet"
SERVING_DIR = DATA_DIR / "serving"
PLAYER_SEASON_PARQUET = SERVING_DIR / "player_season.parquet"
TEAM_SEASON_PARQUET = SERVING_DIR / "team_season.parquet"
SHOTS_PARQUET = SERVING_DIR / "shots.parquet"
DUCKDB_PATH = SERVING_DIR / "apex.duckdb"

MIN_MINUTES = 450            # percentile eligibility gate
PPDA_ZONE_X = 48.0           # pressing-zone x-threshold on the 120-long pitch (40%)

def position_group(position: str) -> str:
    """Map a StatsBomb position name to GK/DEF/MID/FWD."""
    if not position or not isinstance(position, str):
        return "MID"
    p = position.lower()
    if "goalkeeper" in p:
        return "GK"
    if "wing back" in p or "back" in p:
        return "DEF"
    if "forward" in p or "striker" in p or "wing" in p:
        return "FWD"
    if "midfield" in p:
        return "MID"
    return "MID"
