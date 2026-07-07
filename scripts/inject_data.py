#!/usr/bin/env python3
"""Inject APEX XI data into the wireframe artifact WITHOUT changing its UI.

The wireframe (`docs/APEX XI - Football Analytics v2.html`) is an Anthropic
design-tool export: a React+canvas component compiled at load by a proprietary
`__bundler` runtime. We keep the bundle byte-for-byte intact and only:

  1. surgically overlay one line in the component's `teamWC(code)` so the World
     Cup Teams metrics come from `window.__APEX_WC` (falling back to the
     original generated values on any error — guarded, so it can never blank
     the UI), and
  2. inject a `<script>` that sets `window.__APEX_WC` from
     `docs/data/football_analytics_data.json`.

Output: `dashboard/index.html` — serve it over HTTP (the artifact self-loads via
`fetch(location.href)`, so `file://` will not work):

    python3 -m http.server 8090 --directory dashboard
    open http://localhost:8090/

Run:  python3 scripts/inject_data.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIREFRAME = ROOT / "docs" / "APEX XI - Football Analytics v2.html"
DATA = ROOT / "docs" / "data" / "football_analytics_data.json"
OUT = ROOT / "dashboard" / "index.html"

# --- Overlay A: World Cup Teams metrics (from window.__APEX_WC, JSON-sourced) ---
ANCHOR = "str:s}; this._twc[code]=res;"
OVERLAY = (
    "str:s}; try{if(window.__APEX_WC&&window.__APEX_WC[code])"
    "Object.assign(res,window.__APEX_WC[code]);}catch(e){} this._twc[code]=res;"
)

# --- Overlay B: World Cup standings/groups (from window.__APEX_STD, API-sourced) ---
# `this.wcStd=teams.map(...)` is the single point group tables are built from.
STD_ANCHOR = "Pts:3*w+d}; });"
STD_OVERLAY = (
    "Pts:3*w+d}; }); try{if(window.__APEX_STD)this.wcStd.forEach(function(x){"
    "var o=window.__APEX_STD[x.code];if(o)Object.assign(x,o);});}catch(e){}"
)

# --- Overlay C: make fetchLive() actually pull the live serving API, then re-render ---
FETCH_ANCHOR = "fetchLive(){ if(this._wcTried)return; this._wcTried=true;"
FETCH_OVERLAY = (
    "fetchLive(){ if(this._wcTried)return; this._wcTried=true;"
    " try{var __b=(window.__APEX_API||'http://localhost:8000');var __self=this;"
    "fetch(__b+'/api/live/standings').then(function(r){return r.ok?r.json():[];})"
    ".then(function(rows){var n2c=window.__APEX_NAME2CODE||{};var std={};"
    "(rows||[]).forEach(function(r){var c=n2c[r.team];if(c)std[c]="
    "{P:r.played,W:r.w,D:r.d,L:r.l,GF:r.gf,GA:r.ga,Pts:r.points};});"
    "if(Object.keys(std).length){window.__APEX_STD=std;__self._wc=null;__self._twc={};__self._wcPl=null;"
    "__self.wcState={loaded:true,live:true,lastSync:new Date().toLocaleTimeString([],"
    "{hour:'2-digit',minute:'2-digit'}),source:'Sofascore (live via serving API)'};"
    "console.log('[APEX] live standings:',Object.keys(std).length,'teams');}"
    "if(__self.state.source==='wc')__self.forceUpdate();}).catch(function(){});}catch(e){}"
)

# JSON team_metrics field -> the field names teamWC() returns.
METRIC_MAP = {
    "possession_pct": "poss", "xg_for": "xgFor", "xg_against": "xgA",
    "shots": "sh", "shots_on_target": "sot", "pass_pct": "passpct",
    "ppda": "ppda", "team_rating": "rating",
}


def build_wc_metrics(data: dict) -> dict:
    """code -> {teamWC field: value} from world_cup_2026.team_metrics."""
    out = {}
    for t in data["world_cup_2026"]["team_metrics"]:
        out[t["code"]] = {dst: t[src] for src, dst in METRIC_MAP.items() if src in t}
    return out


API_BASE = "http://localhost:8000"  # serving API for the live World Cup tabs


import os

# WC live-standings/fetchLive wiring is opt-in (APEX_WC_LIVE=1) while it's being
# debugged — the default (teamWC metrics only) is the known-good version.
WC_LIVE = os.environ.get("APEX_WC_LIVE") == "1"


def inject(html: str, data: dict) -> str:
    overlays = [("teamWC (Teams metrics)", ANCHOR, OVERLAY)]
    if WC_LIVE:
        overlays += [
            ("wcStd (Groups standings)", STD_ANCHOR, STD_OVERLAY),
            ("fetchLive (live API)", FETCH_ANCHOR, FETCH_OVERLAY),
        ]
    # 1) surgical overlays (raw replace preserves the bundle's escaping)
    for name, anchor, overlay in overlays:
        c = html.count(anchor)
        if c != 1:
            raise SystemExit(
                f"anchor for {name} found {c}x (expected 1). The wireframe "
                f"changed; update the anchor in {__file__}."
            )
        html = html.replace(anchor, overlay)

    # 2) inject the data globals right after <head> (persist on window across the
    #    runtime's document swap). All numbers/codes -> no '</script>'.
    metrics = data["world_cup_2026"]["team_metrics"]
    wc = build_wc_metrics(data)
    name2code = {t["team"]: t["code"] for t in metrics}
    globs = (
        "window.__APEX_WC=%s;window.__APEX_NAME2CODE=%s;window.__APEX_API=%s;"
        % (
            json.dumps(wc, ensure_ascii=False),
            json.dumps(name2code, ensure_ascii=False),
            json.dumps(API_BASE),
        )
    )
    if "</script>" in globs:
        raise SystemExit("data contains '</script>' — would break the injected tag.")
    tag = (
        "<script>%s console.log('[APEX] injected: WC metrics %%d, name-map %%d, api %%s',"
        "Object.keys(window.__APEX_WC).length,Object.keys(window.__APEX_NAME2CODE).length,"
        "window.__APEX_API);</script>" % globs
    )
    html = html.replace("<head>", "<head>\n" + tag, 1)
    return html


def main() -> int:
    html = WIREFRAME.read_text(encoding="utf-8")
    data = json.loads(DATA.read_text(encoding="utf-8"))
    # guard: the surgical edit must preserve the bundler's </script> escaping.
    before = html.count("\\u002Fscript")
    patched = inject(html, data)
    if patched.count("\\u002Fscript") != before:
        raise SystemExit("bundle escaping changed — refusing to write.")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(patched, encoding="utf-8")
    teams = len(build_wc_metrics(data))
    print(f"wrote {OUT.relative_to(ROOT)}  (WC metrics for {teams} teams)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
