from apex.live import cli

def test_refresh_calls_serve_once(monkeypatch):
    calls = {"n": 0}
    monkeypatch.setattr(cli, "serve", lambda client, now_ts: calls.__setitem__("n", calls["n"] + 1) or {"source": "live", "live": 1, "fixtures": 0, "standings": 0})
    monkeypatch.setattr(cli, "SofascoreClient", lambda: object())
    rc = cli.main(["refresh"])
    assert rc == 0 and calls["n"] == 1
