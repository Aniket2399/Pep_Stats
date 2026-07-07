import pytest
from apex.api import db
from apex import config

def test_get_connection_reads(apex_db):
    con = db.get_connection()
    assert con.execute("select count(*) from team_season").fetchone()[0] == 2
    con.close()

def test_table_exists(apex_db):
    con = db.get_connection()
    assert db.table_exists(con, "player_season") is True
    assert db.table_exists(con, "nope") is False
    con.close()

def test_missing_db_raises_unavailable(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DUCKDB_PATH", tmp_path / "absent.duckdb")
    with pytest.raises(db.DbUnavailable):
        db.get_connection()
