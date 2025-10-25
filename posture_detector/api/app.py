# api/app.py
from flask import Flask, render_template
import os
import re

from flask import Flask, render_template
import os

BASE_DIR = os.path.dirname(__file__)
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static")
)

LOG_PATH = os.path.join(os.path.dirname(__file__), "logs", "posture.log")

@app.route("/")
def home():
    entries = []

    if os.path.exists(LOG_PATH):
        with open(LOG_PATH, "r") as f:
            for line in f.readlines():
                match = re.search(
                    r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) .* user=(\w+) status=(\w+) angle=([\d\.]+) confidence=([\d\.]+)",
                    line
                )
                if match:
                    timestamp, user, status, angle, conf = match.groups()
                    entries.append({
                        "timestamp": timestamp,
                        "user": user,
                        "status": status,
                        "angle": float(angle),
                        "confidence": float(conf)
                    })

    return render_template("dashboard.html", entries=entries[-50:][::-1])  # last 50 entries, newest first


if __name__ == "__main__":
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    app.run(port=5000, debug=True)
