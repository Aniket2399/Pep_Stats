"""Model: player_season aggregates + league-wide position-group percentiles."""
import pandas as pd
from .. import config

PER90_METRICS = ["goals_per90", "assists_per90", "xg_per90", "xa_per90",
                 "shots_per90", "passes_per90", "prog_passes_per90",
                 "pressures_per90", "tackles_per90", "interceptions_per90"]

def compute_minutes(master: pd.DataFrame) -> pd.DataFrame:
    """Minutes per (player_id, team_id) from Starting XI + Substitution events."""
    records = {}   # (player_id, team_id) -> minutes
    apps = {}
    for match_id, mev in master.groupby("match_id"):
        m = mev["minute"].max()
        match_end = 0.0 if pd.isna(m) else float(m)
        # starters from Starting XI tactics
        on = {}   # player_id -> (team_id, start_minute)
        for _, r in mev[mev["type"] == "Starting XI"].iterrows():
            tac = r["tactics"] or {}
            for item in tac.get("lineup", []):
                pid = int(item["player"]["id"])
                on[pid] = (r["team_id"], 0.0)
        # substitutions: player off, replacement on
        # NOTE: sent-off (red card) players are not removed from `on` early here;
        # their minutes run to their next substitution or match end regardless of
        # dismissal (documented, spec-tolerated limitation).
        for _, r in mev[mev["type"] == "Substitution"].sort_values("minute").iterrows():
            minute = float(r["minute"])
            off_pid = r["player_id"]
            off_pid = int(off_pid) if pd.notna(off_pid) else off_pid
            if off_pid in on:
                tid, start = on.pop(off_pid)
                _add(records, apps, off_pid, tid, minute - start)
            rep = r["substitution_replacement_id"]
            if pd.notna(rep):
                on[int(rep)] = (r["team_id"], minute)
        # anyone still on played to match end
        for pid, (tid, start) in on.items():
            _add(records, apps, pid, tid, match_end - start)
    rows = [{"player_id": pid, "team_id": tid, "minutes": mins, "appearances": apps[(pid, tid)]}
            for (pid, tid), mins in records.items()]
    return pd.DataFrame(rows)

def _add(records, apps, pid, tid, mins):
    key = (pid, tid)
    records[key] = records.get(key, 0.0) + max(0.0, float(mins))
    apps[key] = apps.get(key, 0) + 1

def build_player_season(master: pd.DataFrame) -> pd.DataFrame:
    ev = master
    mins = compute_minutes(ev)
    key = ["player_id", "team_id"]

    # per-(player, team) raw aggregates (attributed to the player's own events,
    # keyed by team so a player who appears for two teams gets one row per team)
    shots = ev[ev["type"] == "Shot"]
    passes = ev[ev["type"] == "Pass"]
    goals = shots[shots["shot_outcome"] == "Goal"]
    # xA: sum xG of shots each pass assisted (via pass_assisted_shot_id -> shot id)
    shot_xg = shots.set_index("id")["shot_statsbomb_xg"]
    passes = passes.copy()
    passes["assisted_xg"] = passes["pass_assisted_shot_id"].map(shot_xg).fillna(0.0)

    key_idx = pd.MultiIndex.from_frame(ev.dropna(subset=key)[key].drop_duplicates())

    def sum_by(df, col):
        return df.groupby(key)[col].sum()
    def count_by(df):
        return df.groupby(key).size()

    agg_df = pd.DataFrame(index=key_idx)
    agg_df["goals"] = count_by(goals).reindex(key_idx).fillna(0)
    agg_df["xg"] = sum_by(shots, "shot_statsbomb_xg").reindex(key_idx).fillna(0.0)
    agg_df["shots"] = count_by(shots).reindex(key_idx).fillna(0)
    agg_df["assists"] = sum_by(passes, "pass_goal_assist").reindex(key_idx).fillna(0.0)
    agg_df["xa"] = sum_by(passes, "assisted_xg").reindex(key_idx).fillna(0.0)
    agg_df["passes"] = count_by(passes).reindex(key_idx).fillna(0)
    prog = passes[(passes["pass_end_x"].fillna(0) - passes["location_x"].fillna(0)) >= 10]
    agg_df["prog_passes"] = count_by(prog).reindex(key_idx).fillna(0)
    agg_df["pressures"] = count_by(ev[ev["type"] == "Pressure"]).reindex(key_idx).fillna(0)
    agg_df["tackles"] = count_by(ev[ev["type"] == "Duel"]).reindex(key_idx).fillna(0)
    agg_df["interceptions"] = count_by(ev[ev["type"] == "Interception"]).reindex(key_idx).fillna(0)

    # identity: name, team, primary position (most frequent non-null position),
    # keyed by (player_id, team_id) so a player's stint at each team is separate
    ident = (ev.dropna(subset=key)
               .groupby(key)
               .agg(player=("player", "first"), team=("team", "first")))
    pos = (ev.dropna(subset=key + ["position"])
             .groupby(key)["position"]
             .agg(lambda s: s.mode().iloc[0] if not s.mode().empty else None))
    ident["primary_position"] = pos
    ident["position_group"] = ident["primary_position"].map(config.position_group)

    out = ident.join(agg_df).reset_index().merge(mins, on=key, how="left")
    out["minutes"] = out["minutes"].fillna(0.0)
    out["appearances"] = out["appearances"].fillna(0).astype(int)

    # per-90
    per90 = out["minutes"].replace(0, pd.NA)
    out["goals_per90"] = out["goals"] / per90 * 90
    out["assists_per90"] = out["assists"] / per90 * 90
    out["xg_per90"] = out["xg"] / per90 * 90
    out["xa_per90"] = out["xa"] / per90 * 90
    out["shots_per90"] = out["shots"] / per90 * 90
    out["passes_per90"] = out["passes"] / per90 * 90
    out["prog_passes_per90"] = out["prog_passes"] / per90 * 90
    out["pressures_per90"] = out["pressures"] / per90 * 90
    out["tackles_per90"] = out["tackles"] / per90 * 90
    out["interceptions_per90"] = out["interceptions"] / per90 * 90
    for m in PER90_METRICS:
        out[m] = out[m].fillna(0.0)

    # league-wide percentiles within position group, among eligible players
    eligible = out["minutes"] >= config.MIN_MINUTES
    for m in PER90_METRICS:
        pct_col = "percentile_" + m
        out[pct_col] = 0.0
        for grp, idx in out[eligible].groupby("position_group").groups.items():
            ranks = out.loc[idx, m].rank(pct=True) * 100
            out.loc[idx, pct_col] = ranks.round(1)
    out["season"] = config.SEASON_LABEL
    return out
