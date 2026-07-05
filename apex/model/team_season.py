"""Model: team_season standings + style metrics (xG, possession, PPDA)."""
import pandas as pd
from .. import config

PCT_METRICS = ["xg_for", "xg_against", "possession_pct", "ppda", "points"]

def _standings(matches: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for _, m in matches.iterrows():
        hs, as_ = m["home_score"], m["away_score"]
        for team, gf, ga in [(m["home_team"], hs, as_),
                              (m["away_team"], as_, hs)]:
            rows.append({"team": team, "gf": gf, "ga": ga,
                         "win": int(gf > ga), "draw": int(gf == ga), "loss": int(gf < ga)})
    df = pd.DataFrame(rows).groupby("team", as_index=False).agg(
        matches=("gf", "size"), wins=("win", "sum"), draws=("draw", "sum"),
        losses=("loss", "sum"), gf=("gf", "sum"), ga=("ga", "sum"))
    df["points"] = df["wins"] * 3 + df["draws"]
    df["gd"] = df["gf"] - df["ga"]
    return df

def build_team_season(master: pd.DataFrame, matches: pd.DataFrame) -> pd.DataFrame:
    ev = master
    table = _standings(matches)
    # team_id has no place in a name-only matches frame; derive it from the
    # events, which carry both team (name) and team_id per statsbombpy.
    team_ids = master[["team", "team_id"]].drop_duplicates()
    table = table.merge(team_ids, on="team", how="left")

    shots = ev[ev["type"] == "Shot"]
    xg_for = shots.groupby("team_id")["shot_statsbomb_xg"].sum().rename("xg_for")
    shots_for = shots.groupby("team_id").size().rename("shots_for")

    # xg_against / shots_against: per match, the other team's shots
    xg_against = {}; shots_against = {}
    for mid, mev in shots.groupby("match_id"):
        by_team = mev.groupby("team_id")
        totals_xg = by_team["shot_statsbomb_xg"].sum().to_dict()
        totals_n = by_team.size().to_dict()
        allt = set(master[master.match_id == mid]["team_id"].dropna().unique())
        for t in allt:
            opp = [x for x in allt if x != t]
            xg_against[t] = xg_against.get(t, 0.0) + sum(totals_xg.get(o, 0.0) for o in opp)
            shots_against[t] = shots_against.get(t, 0) + sum(totals_n.get(o, 0) for o in opp)

    passes = ev[ev["type"] == "Pass"]

    # PPDA per team: opponent passes in pressing zone / own defensive actions in zone
    # possession_pct per team: team's own passes / total passes in the matches THAT
    # TEAM played (not the league-wide pass total, which would dilute/inflate it
    # depending on how many matches other teams contributed).
    #
    # PPDA definition: every event is recorded in the attacking direction of the
    # team executing it (both teams "attack" toward x=120 in their own events),
    # so the opponent's build-up zone (their own defensive/middle third, low x
    # in THEIR frame) and the pressing team's defensive/press zone (high x in
    # THEIR frame) are two DIFFERENT numeric ranges even though they describe
    # the same physical strip of the pitch. Numerator = opponent passes with
    # opponent's location_x <= (120 - PPDA_ZONE_X) (their own build-up, ~60%
    # of the pitch nearest their own goal); denominator = pressing team's
    # defensive actions with location_x >= PPDA_ZONE_X (that team's press,
    # ~40% from goal in their own frame) — both reference the same physical
    # zone. Standard PPDA counts tackles/interceptions/fouls as defensive
    # actions, not pressures, so "Pressure" is excluded from def_types.
    def_types = ["Duel", "Interception", "Foul Committed"]
    ppda = {}
    possession = {}
    for t in table["team_id"]:
        # matches where t played
        t_matches = set(master[master.team_id == t]["match_id"].unique())

        match_passes = passes[passes["match_id"].isin(t_matches)]
        team_passes_n = len(match_passes[match_passes["team_id"] == t])
        total_passes_n = len(match_passes)
        possession[t] = (team_passes_n / total_passes_n * 100) if total_passes_n else float("nan")

        opp_passes = passes[(passes["team_id"] != t)
                             & (passes["location_x"] <= (120 - config.PPDA_ZONE_X))]
        # count only opp passes in matches where t played
        opp_passes = opp_passes[opp_passes["match_id"].isin(t_matches)]
        def_actions = ev[(ev["team_id"] == t) & (ev["type"].isin(def_types))
                         & (ev["location_x"] >= config.PPDA_ZONE_X)]
        n_def = len(def_actions)
        ppda[t] = (len(opp_passes) / n_def) if n_def else float("nan")
    possession = pd.Series(possession, name="possession_pct", dtype="float64")

    out = (table.set_index("team_id")
           .join(xg_for).join(shots_for)
           .assign(xg_against=pd.Series(xg_against, dtype="float64"),
                   shots_against=pd.Series(shots_against, dtype="float64"),
                   possession_pct=possession,
                   ppda=pd.Series(ppda, dtype="float64"))
           .reset_index())
    for c in ["xg_for", "xg_against", "shots_for", "shots_against"]:
        out[c] = out[c].fillna(0.0)
    out["xg_diff"] = out["xg_for"] - out["xg_against"]

    for m in PCT_METRICS:
        # lower PPDA = more aggressive; invert so higher percentile = more pressing
        series = -out[m] if m == "ppda" else out[m]
        out["percentile_" + m] = (series.rank(pct=True) * 100).round(1)
    out["season"] = config.SEASON_LABEL
    return out
