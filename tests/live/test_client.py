import pytest
from apex.live import client as cl

class FakeScraper:
    def __init__(self, result=None, exc=None):
        self.result, self.exc, self.calls = result, exc, 0
    def get_match_dicts(self, season, league):
        self.calls += 1
        if self.exc: raise self.exc
        return self.result

def test_get_wc_matches_returns_list():
    fake = FakeScraper(result=[{"id": 1}, {"id": 2}])
    c = cl.SofascoreClient(_scraper=fake)
    assert c.get_wc_matches() == [{"id": 1}, {"id": 2}]
    assert fake.calls == 1

def test_get_wc_matches_raises_on_scraper_error():
    c = cl.SofascoreClient(_scraper=FakeScraper(exc=RuntimeError("blocked")), backoff=0)
    with pytest.raises(cl.LiveDataError):
        c.get_wc_matches()

def test_get_wc_matches_raises_on_empty():
    c = cl.SofascoreClient(_scraper=FakeScraper(result=[]), backoff=0)
    with pytest.raises(cl.LiveDataError):
        c.get_wc_matches()
