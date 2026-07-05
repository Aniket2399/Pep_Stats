"""Model package: run all three transforms from the cleaned master."""
import pandas as pd
from .. import config
from .player_season import build_player_season
from .team_season import build_team_season
from .shots import build_shots

def run_model() -> None:
    master = pd.read_parquet(config.EVENTS_MASTER)
    matches = pd.read_parquet(config.MATCHES_PARQUET)
    config.SERVING_DIR.mkdir(parents=True, exist_ok=True)
    build_player_season(master).to_parquet(config.PLAYER_SEASON_PARQUET, index=False)
    build_team_season(master, matches).to_parquet(config.TEAM_SEASON_PARQUET, index=False)
    build_shots(master).to_parquet(config.SHOTS_PARQUET, index=False)
