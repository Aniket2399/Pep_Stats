# APEX XI — Football Analytics · Data

Data powering the APEX XI dashboard, in CSV and JSON.

## Files
- `historic/la_liga_2014_15_standings.csv` — 20-team La Liga 2014/15 table
- `historic/fc_barcelona_squad_2014_15.csv` — Barcelona per-player season stats
- `worldcup2026/team_metrics.csv` — 48 teams, scraped-style metrics (possession, xG, xGA, shots, SoT, pass %, PPDA, rating)
- `worldcup2026/group_standings.csv` — 12 groups, long form
- `football_analytics_data.json` — everything combined, typed

## Sources & honesty note
This is a **wireframe / prototype**. The **historic** side is modeled on the real 2014/15 La Liga season in a StatsBomb-style shape. The **World Cup 2026** metrics are **deterministically generated** in the schema that the ScraperFC package (FBref / Sofascore / Understat) returns — they are realistic placeholders, **not** live-scraped results. Drop real ScraperFC output into the same columns to make the dashboard show true data.

Lambda-architecture framing: batch layer = StatsBomb historic · scrape/speed layer = ScraperFC current-tournament · serving layer = these files feeding the dashboard.
