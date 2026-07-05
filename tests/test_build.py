import duckdb, pandas as pd
from apex import clean, serving, config
from apex.model import run_model
from tests.synthetic import raw_events, matches_df

def test_pipeline_end_to_end(tmp_path, monkeypatch):
    for attr, val in {
        "PROCESSED_DIR": tmp_path/"p", "EVENTS_MASTER": tmp_path/"p"/"events.parquet",
        "SERVING_DIR": tmp_path/"s", "MATCHES_PARQUET": tmp_path/"matches.parquet",
        "PLAYER_SEASON_PARQUET": tmp_path/"s"/"player_season.parquet",
        "TEAM_SEASON_PARQUET": tmp_path/"s"/"team_season.parquet",
        "SHOTS_PARQUET": tmp_path/"s"/"shots.parquet",
        "DUCKDB_PATH": tmp_path/"s"/"apex.duckdb",
    }.items():
        monkeypatch.setattr(config, attr, val)

    matches = matches_df([{ "match_id": 1, "match_date": "2016-01-01", "match_week": 1,
        "home_team_id": 1, "home_team": "H", "away_team_id": 2, "away_team": "A",
        "home_score": 1, "away_score": 0}])
    (tmp_path/"p").mkdir(); matches.to_parquet(config.MATCHES_PARQUET)
    ev = raw_events(1, [
        {"id": "sx", "type": "Starting XI", "team": "H", "team_id": 1, "minute": 0,
         "tactics": {"lineup": [{"player": {"id": 9, "name": "X"}, "position": {"name": "Center Forward"}}]}},
        {"id": "s", "type": "Shot", "team": "H", "team_id": 1, "player": "X", "player_id": 9,
         "position": "Center Forward", "minute": 30, "location": [112.0, 38.0],
         "shot_statsbomb_xg": 0.5, "shot_outcome": "Goal"},
        {"id": "end", "type": "Pass", "team": "H", "team_id": 1, "player_id": 9, "minute": 90,
         "location": [10.0, 40.0]},
    ])
    master = clean.clean({1: ev}, matches)
    master.to_parquet(config.EVENTS_MASTER, index=False)
    run_model()
    serving.serve()

    con = duckdb.connect(str(config.DUCKDB_PATH))
    assert con.execute("select count(*) from shots").fetchone()[0] == 1
    assert con.execute("select count(*) from team_season").fetchone()[0] == 2
    assert con.execute("select gf from team_season where team_id=1").fetchone()[0] == 1
