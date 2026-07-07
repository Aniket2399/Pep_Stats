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

# The exact tail of teamWC(code) — real values overlay the generated ones here.
ANCHOR = "str:s}; this._twc[code]=res;"
OVERLAY = (
    "str:s}; try{if(window.__APEX_WC&&window.__APEX_WC[code])"
    "Object.assign(res,window.__APEX_WC[code]);}catch(e){} this._twc[code]=res;"
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


def inject(html: str, data: dict) -> str:
    n = html.count(ANCHOR)
    if n != 1:
        raise SystemExit(
            f"teamWC anchor found {n}x (expected 1). The wireframe changed; "
            f"update ANCHOR in {__file__}."
        )
    # 1) surgical overlay (raw replace preserves the bundle's escaping)
    html = html.replace(ANCHOR, OVERLAY)
    # 2) inject the data global right after <head> (persists on window across the
    #    runtime's document swap). JSON here is numbers/codes only -> no </script>.
    wc = build_wc_metrics(data)
    glob = json.dumps(wc, ensure_ascii=False)
    if "</script>" in glob:
        raise SystemExit("data contains '</script>' — would break the injected tag.")
    tag = (
        "<script>window.__APEX_WC=%s;"
        "console.log('[APEX] WC metrics injected:',Object.keys(window.__APEX_WC).length);"
        "</script>" % glob
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
