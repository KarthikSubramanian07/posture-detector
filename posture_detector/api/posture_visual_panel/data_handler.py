# data_handler.py
import sys
import json
import logging
from pathlib import Path

LOG_FILE = Path("posture_data.log")

# Set up logging
logger = logging.getLogger("posture")
logger.setLevel(logging.INFO)
handler = logging.FileHandler(LOG_FILE, mode="a")
formatter = logging.Formatter("%(asctime)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)

def handle_posture(data):
    status = data.get("posture_status", "unknown")
    logger.info(f"Posture is {status}")
    return {"ok": True, "status": status}

if __name__ == "__main__":
    raw = sys.stdin.read()  # read JSON from input
    data = json.loads(raw)
    result = handle_posture(data)
    print(json.dumps(result))
