import duckdb
import pandas as pd
import pytest
from apex import config

def _duckdb_safe(df):
    # Pandas 3.0.3 uses StringDtype by default; DuckDB 1.1.3 doesn't recognize it.
    # Convert StringDtype columns to object for compatibility (mirrors apex/live/serve.py).
    for col in df.columns:
        if df[col].dtype.name == "str":
            df[col] = df[col].astype(object)
    return df

def _build(db_path):
    con = duckdb.connect(str(db_path))
    team_season = pd.DataFrame([
        {"team_id": 1, "team": "Alpha", "matches": 2, "wins": 2, "draws": 0, "losses": 0,
         "gf": 5, "ga": 1, "points": 6, "gd": 4, "xg_for": 3.1, "xg_against": 0.9,
         "shots_for": 20, "shots_against": 8, "possession_pct": 60.0, "ppda": 8.5,
         "xg_diff": 2.2, "percentile_xg_for": 99.0, "percentile_xg_against": 90.0,
         "percentile_possession_pct": 95.0, "percentile_ppda": 80.0, "percentile_points": 100.0,
         "season": "2015/2016"},
        {"team_id": 2, "team": "Beta", "matches": 2, "wins": 1, "draws": 0, "losses": 1,
         "gf": 2, "ga": 3, "points": 3, "gd": -1, "xg_for": 1.5, "xg_against": 2.0,
         "shots_for": 10, "shots_against": 15, "possession_pct": 45.0, "ppda": 12.0,
         "xg_diff": -0.5, "percentile_xg_for": 40.0, "percentile_xg_against": 30.0,
         "percentile_possession_pct": 35.0, "percentile_ppda": 40.0, "percentile_points": 50.0,
         "season": "2015/2016"},
    ])
    player_season = pd.DataFrame([
        {"player_id": 10, "team_id": 1, "player": "Striker A", "team": "Alpha",
         "primary_position": "Center Forward", "position_group": "FWD", "goals": 5, "xg": 4.0,
         "shots": 12, "assists": 1, "xa": 0.8, "passes": 100, "prog_passes": 20, "pressures": 30,
         "tackles": 5, "interceptions": 3, "minutes": 540, "appearances": 6,
         "goals_per90": 0.83, "assists_per90": 0.17, "xg_per90": 0.67, "xa_per90": 0.13,
         "shots_per90": 2.0, "passes_per90": 16.7, "prog_passes_per90": 3.3,
         "pressures_per90": 5.0, "tackles_per90": 0.8, "interceptions_per90": 0.5,
         "percentile_goals_per90": 99.0, "percentile_assists_per90": 60.0, "percentile_xg_per90": 95.0,
         "percentile_xa_per90": 55.0, "percentile_shots_per90": 90.0, "percentile_passes_per90": 40.0,
         "percentile_prog_passes_per90": 70.0, "percentile_pressures_per90": 50.0,
         "percentile_tackles_per90": 30.0, "percentile_interceptions_per90": 45.0, "season": "2015/2016"},
        {"player_id": 11, "team_id": 1, "player": "Mid A", "team": "Alpha",
         "primary_position": "Center Midfield", "position_group": "MID", "goals": 1, "xg": 1.2,
         "shots": 4, "assists": 3, "xa": 2.5, "passes": 300, "prog_passes": 40, "pressures": 60,
         "tackles": 15, "interceptions": 10, "minutes": 500, "appearances": 6,
         "goals_per90": 0.18, "assists_per90": 0.54, "xg_per90": 0.22, "xa_per90": 0.45,
         "shots_per90": 0.72, "passes_per90": 54.0, "prog_passes_per90": 7.2,
         "pressures_per90": 10.8, "tackles_per90": 2.7, "interceptions_per90": 1.8,
         "percentile_goals_per90": 50.0, "percentile_assists_per90": 95.0, "percentile_xg_per90": 55.0,
         "percentile_xa_per90": 98.0, "percentile_shots_per90": 40.0, "percentile_passes_per90": 90.0,
         "percentile_prog_passes_per90": 85.0, "percentile_pressures_per90": 80.0,
         "percentile_tackles_per90": 88.0, "percentile_interceptions_per90": 82.0, "season": "2015/2016"},
        {"player_id": 20, "team_id": 2, "player": "Sub B", "team": "Beta",
         "primary_position": "Left Back", "position_group": "DEF", "goals": 0, "xg": 0.1,
         "shots": 1, "assists": 0, "xa": 0.2, "passes": 80, "prog_passes": 5, "pressures": 20,
         "tackles": 8, "interceptions": 6, "minutes": 300, "appearances": 4,
         "goals_per90": 0.0, "assists_per90": 0.0, "xg_per90": 0.03, "xa_per90": 0.06,
         "shots_per90": 0.3, "passes_per90": 24.0, "prog_passes_per90": 1.5,
         "pressures_per90": 6.0, "tackles_per90": 2.4, "interceptions_per90": 1.8,
         "percentile_goals_per90": 10.0, "percentile_assists_per90": 20.0, "percentile_xg_per90": 15.0,
         "percentile_xa_per90": 25.0, "percentile_shots_per90": 20.0, "percentile_passes_per90": 30.0,
         "percentile_prog_passes_per90": 20.0, "percentile_pressures_per90": 40.0,
         "percentile_tackles_per90": 60.0, "percentile_interceptions_per90": 55.0, "season": "2015/2016"},
    ])
    shots = pd.DataFrame([
        {"shot_id": "s1", "match_id": 100, "team_id": 1, "team": "Alpha", "player_id": 10,
         "player": "Striker A", "minute": 23, "location_x": 110.0, "location_y": 40.0,
         "shot_end_x": 120.0, "shot_end_y": 40.0, "shot_statsbomb_xg": 0.5, "outcome": "Goal",
         "body_part": "Right Foot", "shot_type": "Open Play", "play_pattern": "Regular Play",
         "under_pressure": False},
        {"shot_id": "s2", "match_id": 100, "team_id": 2, "team": "Beta", "player_id": 20,
         "player": "Sub B", "minute": 55, "location_x": 100.0, "location_y": 30.0,
         "shot_end_x": 118.0, "shot_end_y": 35.0, "shot_statsbomb_xg": 0.1, "outcome": "Saved",
         "body_part": "Left Foot", "shot_type": "Open Play", "play_pattern": "From Counter",
         "under_pressure": True},
    ])
    live_matches = pd.DataFrame([
        {"id": 900, "home_team": "Spain", "away_team": "Portugal", "home_flag": "🇪🇸", "away_flag": "🇵🇹",
         "home_score": 1, "away_score": 0, "status": "LIVE", "minute": 67, "stage": "Round of 16",
         "kickoff": "2026-07-06T18:00:00+00:00"},
        {"id": 901, "home_team": "USA", "away_team": "Belgium", "home_flag": "🇺🇸", "away_flag": "🇧🇪",
         "home_score": 1, "away_score": 4, "status": "FINISHED", "minute": None, "stage": "Round of 16",
         "kickoff": "2026-07-05T18:00:00+00:00"},
    ])
    fixtures = pd.DataFrame([
        {"id": 902, "home_team": "Brazil", "away_team": "Norway", "home_flag": "🇧🇷", "away_flag": "🇳🇴",
         "stage": "Quarter-final", "kickoff": "2026-07-08T18:00:00+00:00"},
    ])
    standings = pd.DataFrame([
        {"group": "Group A", "rank": 1, "team": "Mexico", "flag": "🇲🇽", "played": 3, "w": 3, "d": 0,
         "l": 0, "gf": 6, "ga": 0, "gd": 6, "points": 9},
        {"group": "Group A", "rank": 2, "team": "South Africa", "flag": "🇿🇦", "played": 3, "w": 1, "d": 1,
         "l": 1, "gf": 3, "ga": 3, "gd": 0, "points": 4},
    ])
    for name, df in [("team_season", team_season), ("player_season", player_season),
                     ("shots", shots), ("live_matches", live_matches),
                     ("fixtures", fixtures), ("standings", standings)]:
        df = _duckdb_safe(df)
        con.register("t", df); con.execute(f"CREATE TABLE {name} AS SELECT * FROM t"); con.unregister("t")
    con.close()

@pytest.fixture(autouse=True)
def apex_db(tmp_path, monkeypatch):
    db = tmp_path / "apex.duckdb"
    _build(db)
    monkeypatch.setattr(config, "DUCKDB_PATH", db)
    return db
