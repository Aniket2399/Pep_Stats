"""APEX live speed-layer CLI."""
import argparse
import logging
import time
from .serve import serve
from .client import SofascoreClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

def _now() -> int:
    return int(time.time())

def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="apex-live", description="APEX WC live speed layer")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("refresh")
    pw = sub.add_parser("watch"); pw.add_argument("--interval", type=int, default=45)
    args = p.parse_args(argv)

    client = SofascoreClient()
    if args.cmd == "refresh":
        res = serve(client, _now())
        logger.info("refresh: %s", res)
        return 0
    if args.cmd == "watch":
        logger.info("watching every %ds (Ctrl-C to stop)", args.interval)
        try:
            while True:
                try:
                    logger.info("refresh: %s", serve(client, _now()))
                except Exception as e:       # keep the loop alive on any error
                    logger.error("watch iteration failed: %s", e)
                time.sleep(args.interval)
        except KeyboardInterrupt:
            logger.info("stopped")
        return 0
    return 1

if __name__ == "__main__":
    raise SystemExit(main())
