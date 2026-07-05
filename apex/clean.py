"""Clean stage: raw events -> immutable tidy master (data/processed/events.parquet)."""
import logging
import pandas as pd
from . import config

logger = logging.getLogger(__name__)

def _split_xy(df: pd.DataFrame, src: str, x: str, y: str) -> None:
    def _x(v): return v[0] if isinstance(v, (list, tuple)) and len(v) >= 2 else None
    def _y(v): return v[1] if isinstance(v, (list, tuple)) and len(v) >= 2 else None
    df[x] = df[src].map(_x)
    df[y] = df[src].map(_y)

def clean(events_by_match: dict, matches: pd.DataFrame) -> pd.DataFrame:
    frames = [df.assign(match_id=mid) if "match_id" not in df else df
              for mid, df in events_by_match.items()]
    ev = pd.concat(frames, ignore_index=True)

    # match context lookup
    mm = matches.set_index("match_id")
    def _ctx(row, field):
        m = mm.loc[row["match_id"]]
        home = row["team_id"] == m["home_team_id"]
        if field == "is_home": return bool(home)
        if field == "opponent": return m["away_team"] if home else m["home_team"]
        if field == "match_date": return m["match_date"]
    ev["is_home"] = ev.apply(lambda r: _ctx(r, "is_home"), axis=1)
    ev["opponent"] = ev.apply(lambda r: _ctx(r, "opponent"), axis=1)
    ev["match_date"] = ev.apply(lambda r: _ctx(r, "match_date"), axis=1)
    ev["season_id"] = config.SEASON_ID

    _split_xy(ev, "location", "location_x", "location_y")
    _split_xy(ev, "pass_end_location", "pass_end_x", "pass_end_y")
    _split_xy(ev, "shot_end_location", "shot_end_x", "shot_end_y")
    _split_xy(ev, "carry_end_location", "carry_end_x", "carry_end_y")

    # ---- validation: fail loudly ----
    if ev["id"].duplicated().any():
        raise ValueError(f"duplicate event id(s): {ev['id'][ev['id'].duplicated()].tolist()[:5]}")
    for key in ("type", "team_id", "match_id"):
        if ev[key].isna().any():
            raise ValueError(f"null values in required column '{key}'")
    shots = ev[ev["type"] == "Shot"]
    if shots["shot_statsbomb_xg"].isna().any():
        raise ValueError("Shot row with null shot_statsbomb_xg (xg)")

    logger.info("clean: %d events across %d matches", len(ev), ev["match_id"].nunique())
    return ev

def run_clean() -> pd.DataFrame:
    import glob
    matches = pd.read_parquet(config.MATCHES_PARQUET)
    events_by_match = {}
    for f in glob.glob(str(config.RAW_EVENTS_DIR / "*.parquet")):
        df = pd.read_parquet(f)
        events_by_match[int(df["match_id"].iloc[0])] = df
    master = clean(events_by_match, matches)
    config.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    master.to_parquet(config.EVENTS_MASTER, index=False)
    return master
