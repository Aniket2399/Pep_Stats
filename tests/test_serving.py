import duckdb, pandas as pd
from pathlib import Path
from apex import serving, config

def test_serve_materializes_three_tables(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "SERVING_DIR", tmp_path)
    monkeypatch.setattr(config, "PLAYER_SEASON_PARQUET", tmp_path / "player_season.parquet")
    monkeypatch.setattr(config, "TEAM_SEASON_PARQUET", tmp_path / "team_season.parquet")
    monkeypatch.setattr(config, "SHOTS_PARQUET", tmp_path / "shots.parquet")
    monkeypatch.setattr(config, "DUCKDB_PATH", tmp_path / "apex.duckdb")
    pd.DataFrame({"player_id": [1]}).to_parquet(config.PLAYER_SEASON_PARQUET)
    pd.DataFrame({"team_id": [1]}).to_parquet(config.TEAM_SEASON_PARQUET)
    pd.DataFrame({"shot_id": ["s"]}).to_parquet(config.SHOTS_PARQUET)
    serving.serve()
    names = serving.table_names(config.DUCKDB_PATH)
    assert {"player_season", "team_season", "shots"}.issubset(set(names))
    con = duckdb.connect(str(config.DUCKDB_PATH))
    assert con.execute("select count(*) from player_season").fetchone()[0] == 1
