import sys
import json
import logging
import random
import time
from pathlib import Path
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
# Create logs directory
LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Create a timestamped log file
timestamp_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
LOG_FILE = LOG_DIR / f"posture_{timestamp_str}.log"
STATS_FILE = LOG_DIR / "summary.json"

# Setup logging
logger = logging.getLogger("posture_data")
logger.setLevel(logging.INFO)

# File handler (new file each run)
handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
formatter = logging.Formatter("%(asctime)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)


def update_summary(status: str):
    """Compute overall correctness percentage and save to JSON."""
    if not STATS_FILE.exists():
        summary = {"correct": 0, "incorrect": 0}
    else:
        summary = json.loads(STATS_FILE.read_text())

    if status == "correct":
        summary["correct"] = summary.get("correct", 0) + 1
    elif status == "incorrect":
        summary["incorrect"] = summary.get("incorrect", 0) + 1

    total = summary["correct"] + summary["incorrect"]
    summary["accuracy"] = round(summary["correct"] / total, 3) if total else 0.0
    STATS_FILE.write_text(json.dumps(summary, indent=2))
    return summary

@app.route('/api/log_posture', methods=['GET'])
def log():
    """
    Logs posture data (1=correct, 0=incorrect) and confidence value.
    Updates summary.json and returns it as dict.
    Can be imported and called from Flask or Node.
    """
    posture = request.args.get('posture')
    confidence = float(request.args.get('confidence'))
    status = "correct" if posture == 1 else "incorrect"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    log_line = f"user=system posture={status} confidence={confidence:.3f}"
    logger.info(log_line)

    summary = update_summary(status)
    return jsonify({"timestamp": timestamp, "status": status, "confidence": confidence, "summary": summary})


# if __name__ == "__main__":
#     print(f"🟢 Logging random posture data into: {LOG_FILE.name} (Ctrl+C to stop)")

#     try:
#         while True:
#             # Generate random posture data
#             posture = random.choice([0, 1])
#             confidence = round(random.uniform(0.75, 1.0), 3)
#             result = log(posture, confidence)

#             print(
#                 f"[{result['timestamp']}] {result['status']} | "
#                 f"conf={confidence:.3f} | acc={result['summary']['accuracy']}"
#             )

#             time.sleep(3)

#     except KeyboardInterrupt:
#         print("\n Logging stopped.")
# Run
if __name__ == '__main__':
    app.run(port=3500, debug=True)