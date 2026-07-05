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


def test_possession_per_team_matches():
    # Two INDEPENDENT matches (teams 1&2 in match 1, teams 3&4 in match 2).
    # Regression for CRITICAL-2: possession_pct must be team passes / passes in that
    # team's OWN matches, not diluted by league-wide passes across unrelated matches.
    matches = matches_df([
        {"match_id": 1, "match_date": "2016-01-01", "match_week": 1,
         "home_team_id": 1, "home_team": "H1", "away_team_id": 2, "away_team": "A1",
         "home_score": 0, "away_score": 0},
        {"match_id": 2, "match_date": "2016-01-02", "match_week": 1,
         "home_team_id": 3, "home_team": "H2", "away_team_id": 4, "away_team": "A2",
         "home_score": 0, "away_score": 0},
    ])
    rows1 = [{"id": f"m1h{i}", "type": "Pass", "team": "H1", "team_id": 1,
              "location": [50.0, 40.0]} for i in range(8)]
    rows1 += [{"id": f"m1a{i}", "type": "Pass", "team": "A1", "team_id": 2,
               "location": [50.0, 40.0]} for i in range(2)]
    rows2 = [{"id": f"m2h{i}", "type": "Pass", "team": "H2", "team_id": 3,
              "location": [50.0, 40.0]} for i in range(50)]
    master = clean.clean({1: raw_events(1, rows1), 2: raw_events(2, rows2)}, matches)
    out = ts.build_team_season(master, matches).set_index("team_id")
    # team 1 made 8 of 10 passes in ITS match (match 1) -> ~80%, not diluted by
    # match 2's 50 passes (which would give 8/60 ≈ 13.3% under the old bug).
    assert round(out.loc[1, "possession_pct"]) == 80
