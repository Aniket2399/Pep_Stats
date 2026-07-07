"""Normalize Sofascore match dicts into tidy Match rows."""
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_STATUS = {"inprogress": "LIVE", "notstarted": "SCHEDULED", "finished": "FINISHED"}

def map_status(t: str) -> str:
    s = _STATUS.get(t)
    if s is None:
        logger.warning("Unknown status type %r -> SCHEDULED", t)
        return "SCHEDULED"
    return s

# FIFA 3-letter code -> flag emoji (WC 2026 nations; extend as needed)
_FLAGS = {
    "NOR": "🇳🇴", "EGY": "🇪🇬", "URU": "🇺🇾", "CRO": "🇭🇷", "NZL": "🇳🇿", "CPV": "🇨🇻",
    "USA": "🇺🇸", "MEX": "🇲🇽", "CAN": "🇨🇦", "BRA": "🇧🇷", "ARG": "🇦🇷", "FRA": "🇫🇷",
    "ESP": "🇪🇸", "ENG": "🏴", "GER": "🇩🇪", "POR": "🇵🇹", "NED": "🇳🇱", "BEL": "🇧🇪",
    "ITA": "🇮🇹", "COL": "🇨🇴", "GHA": "🇬🇭", "MAR": "🇲🇦", "JPN": "🇯🇵", "KOR": "🇰🇷",
    "SEN": "🇸🇳", "NGA": "🇳🇬", "AUS": "🇦🇺", "SUI": "🇨🇭", "DEN": "🇩🇰", "POL": "🇵🇱",
    "SRB": "🇷🇸", "CMR": "🇨🇲", "CIV": "🇨🇮", "KSA": "🇸🇦", "QAT": "🇶🇦", "IRN": "🇮🇷",
    "CRC": "🇨🇷", "TUN": "🇹🇳", "ALG": "🇩🇿", "ECU": "🇪🇨", "PAR": "🇵🇾", "AUT": "🇦🇹",
    "UZB": "🇺🇿", "JOR": "🇯🇴", "RSA": "🇿🇦", "PAN": "🇵🇦", "SCO": "🏴", "WAL": "🏴",
}

def country_flag(code: str) -> str:
    f = _FLAGS.get(code)
    if f is None:
        logger.warning("No flag for country code %r", code)
        return "🏳️"
    return f

def _elapsed(start_ts, now_ts) -> int:
    mins = int((now_ts - start_ts) // 60)
    return max(0, min(mins, 130))

def normalize_match(md: dict, now_ts: int) -> dict:
    status = map_status(md["status"]["type"])
    tour = md.get("tournament", {}) or {}
    group = tour.get("groupName") if tour.get("isGroup") else None
    ri = md.get("roundInfo", {}) or {}
    stage = ri.get("name") or group
    minute = _elapsed(md["startTimestamp"], now_ts) if status == "LIVE" else None
    kickoff = datetime.fromtimestamp(md["startTimestamp"], tz=timezone.utc).isoformat()
    return {
        "id": md["id"],
        "home_team": md["homeTeam"]["name"],
        "away_team": md["awayTeam"]["name"],
        "home_flag": country_flag(md["homeTeam"].get("nameCode", "")),
        "away_flag": country_flag(md["awayTeam"].get("nameCode", "")),
        "home_score": (md.get("homeScore") or {}).get("current"),
        "away_score": (md.get("awayScore") or {}).get("current"),
        "status": status,
        "minute": minute,
        "stage": stage,
        "kickoff": kickoff,
        "group": group,
    }
