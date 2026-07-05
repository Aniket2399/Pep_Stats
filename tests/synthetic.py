"""Builders for synthetic statsbombpy-shaped data (no network)."""
import pandas as pd

# Superset of columns our pipeline reads (verified against statsbombpy output).
EVENT_COLUMNS = [
    "id", "index", "period", "minute", "second", "type", "location",
    "player", "player_id", "position", "team", "team_id",
    "possession", "possession_team", "possession_team_id", "play_pattern",
    "duration", "under_pressure",
    "pass_end_location", "pass_recipient", "pass_recipient_id", "pass_outcome",
    "pass_length", "pass_cross", "pass_shot_assist", "pass_goal_assist",
    "pass_assisted_shot_id", "pass_height", "pass_type",
    "shot_statsbomb_xg", "shot_end_location", "shot_outcome", "shot_type",
    "shot_body_part", "shot_key_pass_id", "shot_first_time",
    "carry_end_location", "dribble_outcome",
    "substitution_replacement", "substitution_replacement_id", "tactics",
]

def raw_events(match_id: int, rows: list[dict]) -> pd.DataFrame:
    """One synthetic match's events. Each row dict overrides EVENT_COLUMNS defaults."""
    df = pd.DataFrame(rows)
    for col in EVENT_COLUMNS:
        if col not in df.columns:
            df[col] = None
    df["match_id"] = match_id
    if "index" not in [c for c in df.columns if df["index"].notna().any()]:
        df["index"] = range(1, len(df) + 1)
    return df[EVENT_COLUMNS + ["match_id"]]

def matches_df(rows: list[dict]) -> pd.DataFrame:
    """Synthetic matches metadata frame (subset of statsbombpy columns we use)."""
    cols = ["match_id", "match_date", "match_week", "competition_id", "season_id",
            "home_team_id", "home_team", "away_team_id", "away_team",
            "home_score", "away_score"]
    df = pd.DataFrame(rows)
    for c in cols:
        if c not in df.columns:
            df[c] = None
    return df[cols]
