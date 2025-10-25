from flask import Flask, render_template
import os
import re
from datetime import datetime

BASE_DIR = os.path.dirname(__file__)
LOG_DIR = os.path.join(BASE_DIR, "logs")

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static")
)


def get_latest_log():
    """Find the most recently created log file."""
    log_files = [
        os.path.join(LOG_DIR, f)
        for f in os.listdir(LOG_DIR)
        if f.startswith("posture_") and f.endswith(".log")
    ]
    if not log_files:
        return None
    return max(log_files, key=os.path.getctime)


def parse_log(file_path):
    """Read the log file and extract posture + confidence data."""
    entries = []
    pattern = re.compile(
        r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ - user=(\w+) posture=(\w+) confidence=([\d.]+)"
    )

    with open(file_path, "r") as f:
        for line in f:
            match = pattern.search(line)
            if match:
                timestamp, user, posture, confidence = match.groups()
                entries.append({
                    "timestamp": timestamp,
                    "user": user,
                    "posture": posture,
                    "confidence": float(confidence)
                })
    return entries


@app.route("/")
def dashboard():
    latest_log = get_latest_log()
    if not latest_log:
        return "<h2>No log files found in /logs directory.</h2>"

    entries = parse_log(latest_log)
    timestamps = [e["timestamp"] for e in entries]
    confidences = [e["confidence"] for e in entries]
    posture_status = [1 if e["posture"] == "correct" else 0 for e in entries]

    accuracy = (
        sum(posture_status) / len(posture_status) * 100 if posture_status else 0
    )

    return render_template(
        "dashboard.html",
        entries=entries[-50:],
        timestamps=timestamps[-50:],
        confidences=confidences[-50:],
        posture_status=posture_status[-50:],
        accuracy=round(accuracy, 2),
        log_name=os.path.basename(latest_log),
    )


if __name__ == "__main__":
    os.makedirs(LOG_DIR, exist_ok=True)
    app.run(port=3500, debug=True)
