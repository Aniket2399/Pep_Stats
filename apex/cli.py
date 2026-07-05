"""APEX batch pipeline CLI."""
import argparse
import logging
from . import ingest as ingest_mod
from . import clean as clean_mod
from . import serving as serving_mod
from .model import run_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="apex", description="APEX StatsBomb batch pipeline")
    sub = p.add_subparsers(dest="cmd", required=True)
    pi = sub.add_parser("ingest"); pi.add_argument("--season", type=int, default=None)
    pi.add_argument("--force", action="store_true")
    sub.add_parser("clean"); sub.add_parser("model"); sub.add_parser("serve")
    pb = sub.add_parser("build"); pb.add_argument("--skip-ingest", action="store_true")
    args = p.parse_args(argv)

    if args.cmd == "ingest":
        from . import config
        ingest_mod.ingest(season_id=args.season or config.SEASON_ID, force=args.force)
    elif args.cmd == "clean":
        clean_mod.run_clean()
    elif args.cmd == "model":
        run_model()
    elif args.cmd == "serve":
        serving_mod.serve()
    elif args.cmd == "build":
        if not args.skip_ingest:
            ingest_mod.ingest()
        clean_mod.run_clean(); run_model(); serving_mod.serve()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
