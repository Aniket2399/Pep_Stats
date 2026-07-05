import pandas as pd, pytest
from apex import clean
from tests.synthetic import raw_events, matches_df

def _matches():
    return matches_df([{ "match_id": 101, "match_date": "2016-01-01", "match_week": 1,
        "home_team_id": 1, "home_team": "Barcelona", "away_team_id": 2, "away_team": "Sevilla",
        "home_score": 2, "away_score": 0}])

def test_clean_flattens_locations_and_context():
    ev = raw_events(101, [
        {"id": "a", "type": "Pass", "team": "Barcelona", "team_id": 1, "player": "X",
         "player_id": 10, "location": [61.0, 40.1], "pass_end_location": [59.3, 42.3]},
        {"id": "b", "type": "Shot", "team": "Sevilla", "team_id": 2, "player": "Y",
         "player_id": 20, "location": [110.0, 40.0], "shot_statsbomb_xg": 0.3,
         "shot_end_location": [120.0, 40.0]},
    ])
    master = clean.clean({101: ev}, _matches())
    row = master[master.id == "a"].iloc[0]
    assert (row.location_x, row.location_y) == (61.0, 40.1)
    assert (row.pass_end_x, row.pass_end_y) == (59.3, 42.3)
    assert row.is_home == True and row.opponent == "Sevilla"
    srow = master[master.id == "b"].iloc[0]
    assert srow.is_home == False and srow.opponent == "Barcelona"

def test_clean_raises_on_shot_without_xg():
    ev = raw_events(101, [{"id": "a", "type": "Shot", "team": "Barcelona", "team_id": 1,
                           "location": [100.0, 40.0], "shot_statsbomb_xg": None}])
    with pytest.raises(ValueError, match="xg"):
        clean.clean({101: ev}, _matches())

def test_clean_raises_on_duplicate_id():
    ev = raw_events(101, [
        {"id": "dup", "type": "Pass", "team": "Barcelona", "team_id": 1, "location": [1.0, 1.0]},
        {"id": "dup", "type": "Pass", "team": "Barcelona", "team_id": 1, "location": [2.0, 2.0]},
    ])
    with pytest.raises(ValueError, match="duplicate"):
        clean.clean({101: ev}, _matches())
