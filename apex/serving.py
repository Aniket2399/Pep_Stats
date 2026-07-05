"""Serve stage: materialize serving Parquet as DuckDB tables."""
import duckdb
from . import config

_TABLES = {
    "player_season": config.PLAYER_SEASON_PARQUET,
    "team_season": config.TEAM_SEASON_PARQUET,
    "shots": config.SHOTS_PARQUET,
}

def serve() -> None:
    config.SERVING_DIR.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(config.DUCKDB_PATH))
    try:
        for table, path in {
            "player_season": config.PLAYER_SEASON_PARQUET,
            "team_season": config.TEAM_SEASON_PARQUET,
            "shots": config.SHOTS_PARQUET,
        }.items():
            con.execute(
                f"CREATE OR REPLACE TABLE {table} AS "
                f"SELECT * FROM read_parquet('{path.as_posix()}')")
    finally:
        con.close()

def table_names(db_path) -> list:
    con = duckdb.connect(str(db_path))
    try:
        return [r[0] for r in con.execute("SHOW TABLES").fetchall()]
    finally:
        con.close()
