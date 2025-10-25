# data_handler.py
import sys
import json
import logging
from pathlib import Path

LOG_FILE = Path("posture_data.log")

# Setup logging
logger = logging.getLogger("posture_data")
logger.setLevel(logging.INFO)
handler = logging.FileHandler(LOG_FILE, mode='a')
formatter = logging.Formatter("%(asctime)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)

# Track stats (optional)
STATS_FILE = Path("summary.json")

def update_summary(status):
    """Compute overall correctness percentage."""
    if not STATS_FILE.exists():
        summary = {"correct": 0, "incorrect": 0}
    else:
        summary = json.loads(STATS_FILE.read_text())

    summary[status] = summary.get(status, 0) + 1
    total = summary["correct"] + summary["incorrect"]
    summary["accuracy"] = round(summary["correct"] / total, 3)
    STATS_FILE.write_text(json.dumps(summary, indent=2))
    return summary

if __name__ == "__main__":
    # Expecting JSON input from JS
    raw_input = sys.stdin.read()
    try:
        data = json.loads(raw_input)
        status = data.get("posture_status", "unknown")
        logger.info(f"Received posture status: {status}")
        summary = update_summary(status)
        print(json.dumps(summary))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
