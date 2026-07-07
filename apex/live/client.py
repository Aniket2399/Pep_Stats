"""Sofascore scraper wrapper — the ONLY module importing ScraperFC."""
import logging
import time
from . import config

logger = logging.getLogger(__name__)

class LiveDataError(Exception):
    """Any failure fetching live data from Sofascore."""

def _default_scraper():
    import ScraperFC
    return ScraperFC.Sofascore()

class SofascoreClient:
    def __init__(self, _scraper=None, retries: int = 3, backoff: float = 1.0):
        self._scraper = _scraper or _default_scraper()
        self.retries = retries
        self.backoff = backoff

    def get_wc_matches(self) -> list:
        last = None
        for attempt in range(self.retries):
            try:
                result = self._scraper.get_match_dicts(config.SEASON, config.LEAGUE)
            except Exception as e:
                last = e
                logger.warning("scrape attempt %d failed: %s", attempt + 1, e)
                time.sleep(self.backoff * (attempt + 1))
                continue
            if not result:
                last = ValueError("empty match list")
                time.sleep(self.backoff * (attempt + 1))
                continue
            return list(result)
        raise LiveDataError(f"get_wc_matches failed after {self.retries} attempts: {last}")
