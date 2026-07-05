import pandas as pd
from apex.model import team_season as ts
from apex import clean
from tests.synthetic import raw_events, matches_df

def test_team_season_standings_and_xg():
    matches = matches_df([{ "match_id": 1, "match_date": "2016-01-01", "match_week": 1,
        "home_team_id": 1, "home_team": "H", "away_team_id": 2, "away_team": "A",
        "home_score": 2, "away_score": 1}])
    ev = raw_events(1, [
        {"id": "s1", "type": "Shot", "team": "H", "team_id": 1, "location": [110.0, 40.0],
         "shot_statsbomb_xg": 0.4, "shot_outcome": "Goal"},
        {"id": "s2", "type": "Shot", "team": "A", "team_id": 2, "location": [110.0, 40.0],
         "shot_statsbomb_xg": 0.2, "shot_outcome": "Goal"},
        {"id": "p1", "type": "Pass", "team": "H", "team_id": 1, "location": [50.0, 40.0]},
        {"id": "p2", "type": "Pass", "team": "H", "team_id": 1, "location": [51.0, 40.0]},
        {"id": "p3", "type": "Pass", "team": "A", "team_id": 2, "location": [50.0, 40.0]},
    ])
    out = ts.build_team_season(clean.clean({1: ev}, matches), matches).set_index("team_id")
    assert out.loc[1, "points"] == 3 and out.loc[1, "wins"] == 1     # H won 2-1
    assert out.loc[2, "points"] == 0 and out.loc[2, "losses"] == 1
    assert out.loc[1, "gf"] == 2 and out.loc[1, "ga"] == 1
    assert round(out.loc[1, "xg_for"], 1) == 0.4
    assert round(out.loc[1, "possession_pct"]) == 67                 # 2 of 3 passes

def test_ppda_ratio():
    matches = matches_df([{ "match_id": 1, "match_date": "2016-01-01", "match_week": 1,
        "home_team_id": 1, "home_team": "H", "away_team_id": 2, "away_team": "A",
        "home_score": 0, "away_score": 0}])
    # opponent(A) makes 4 passes in H's pressing zone; H makes 2 defensive actions there
    rows = []
    for i in range(4):
        rows.append({"id": f"ap{i}", "type": "Pass", "team": "A", "team_id": 2,
                     "location": [60.0, 40.0]})      # opp pass, x < zone-from-opp-side
    rows.append({"id": "t1", "type": "Duel", "team": "H", "team_id": 1, "location": [60.0, 40.0]})
    rows.append({"id": "in1", "type": "Interception", "team": "H", "team_id": 1, "location": [70.0, 40.0]})
    out = ts.build_team_season(clean.clean({1: raw_events(1, rows)}, matches), matches).set_index("team_id")
    assert out.loc[1, "ppda"] == 2.0     # 4 opponent passes / 2 defensive actions
