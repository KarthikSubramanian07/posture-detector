import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
import os, re, time, threading, json, logging
from datetime import datetime
from pathlib import Path

# -------------------
# Configuration Setup
# -------------------
BASE_DIR = Path(__file__).parent
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static")
)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# -------------------
# Logging Setup
# -------------------
timestamp_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
LOG_FILE = LOG_DIR / f"posture_{timestamp_str}.log"
STATS_FILE = LOG_DIR / "summary.json"

logger = logging.getLogger("posture_data")
logger.setLevel(logging.INFO)
handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
formatter = logging.Formatter("%(asctime)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)


# -------------------
# Utility Functions
# -------------------
def update_summary(status: str):
    """Update accuracy summary in summary.json."""
    if STATS_FILE.exists():
        summary = json.loads(STATS_FILE.read_text())
    else:
        summary = {"correct": 0, "incorrect": 0}

    summary[status] = summary.get(status, 0) + 1
    total = summary["correct"] + summary["incorrect"]
    summary["accuracy"] = round(summary["correct"] / total, 3) if total else 0.0

    STATS_FILE.write_text(json.dumps(summary, indent=2))
    return summary


def log_posture(status: str, confidence: float):
    """Log posture and confidence to file."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"user=system posture={status} confidence={confidence:.3f}"
    logger.info(log_line)
    summary = update_summary(status)
    return {"timestamp": timestamp, "status": status, "confidence": confidence, "summary": summary}


def get_latest_log():
    files = [LOG_DIR / f for f in os.listdir(LOG_DIR) if f.startswith("posture_") and f.endswith(".log")]
    return max(files, key=os.path.getctime) if files else None


def parse_log(path):
    pattern = re.compile(
        r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ - user=(\w+) posture=(\w+) confidence=([\d.]+)"
    )
    entries = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = pattern.search(line)
            if m:
                t, u, p, c = m.groups()
                entries.append({"timestamp": t, "user": u, "posture": p, "confidence": float(c)})
    return entries


def get_dashboard_data():
    log = get_latest_log()
    if not log:
        return None
    entries = parse_log(log)
    ts = [e["timestamp"] for e in entries]
    cf = [e["confidence"] for e in entries]
    correct = [1 if e["posture"] == "correct" else 0 for e in entries]
    acc = sum(correct) / len(correct) * 100 if correct else 0
    return {
        "log_name": log.name,
        "entries": entries[-50:],
        "timestamps": ts[-50:],
        "confidences": cf[-50:],
        "accuracy": round(acc, 2),
    }


# -------------------
# Flask Routes
# -------------------
@app.route("/")
def dashboard():
    data = get_dashboard_data()
    if not data:
        return "<h2>No log files found in /logs directory.</h2>"
    return render_template("dashboard.html", **data)


@app.route("/api/app.py", methods=["POST"])
def api_log():
    """Accept JSON like {"status": "correct", "confidence": 0.91}"""
    data = request.get_json(force=True)
    status = data.get("status")
    confidence = float(data.get("confidence", 0))

    if status not in ["correct", "incorrect"]:
        return jsonify({"error": "status must be 'correct' or 'incorrect'"}), 400

    result = log_posture(status, confidence)
    socketio.emit("update", get_dashboard_data())
    print(f"[API] Logged {status} ({confidence:.3f})")
    return jsonify(result)


@app.route("/api/log_posture", methods=["GET"])
def api_log_posture():
    """Accept metrics data from frontend via query parameter."""
    try:
        json_str = request.args.get("json")
        if not json_str:
            return jsonify({"error": "Missing json parameter"}), 400

        metrics = json.loads(json_str)

        # Determine posture status based on torsion_angle
        torsion_angle = metrics.get("torsion_angle", 0)

        # Good posture: torsion angle < 15 degrees
        # Bad posture: torsion angle >= 15 degrees
        if torsion_angle < 15:
            status = "correct"
            confidence = 1.0 - (torsion_angle / 15.0)  # Higher confidence when angle is lower
        else:
            status = "incorrect"
            confidence = min(1.0, (torsion_angle - 15) / 30.0)  # Higher confidence when angle is worse

        confidence = max(0.5, min(0.99, confidence))  # Clamp between 0.5 and 0.99

        result = log_posture(status, confidence)
        socketio.emit("update", get_dashboard_data())
        print(f"[API] Logged posture: {status} (torsion={torsion_angle:.1f}°, confidence={confidence:.3f})")

        return jsonify({
            "success": True,
            "metrics": metrics,
            "posture": status,
            "confidence": confidence,
            "result": result
        })

    except Exception as e:
        print(f"[ERROR] Failed to log posture: {e}")
        return jsonify({"error": str(e)}), 500


# -------------------
# Log Watcher Thread
# -------------------
def watch_logs():
    last_state = None
    while True:
        log = get_latest_log()
        if not log:
            time.sleep(2)
            continue
        try:
            content = open(log, encoding="utf-8").read()
            if content != last_state:
                last_state = content
                data = get_dashboard_data()
                if data:
                    socketio.emit("update", data)
                    print(f"[SOCKET] Update sent: {data['log_name']}")
        except Exception as e:
            print("Watcher error:", e)
        time.sleep(2)


threading.Thread(target=watch_logs, daemon=True).start()

# -------------------
# Run Server
# -------------------
if __name__ == "__main__":
    print("✅ Server starting with Eventlet on http://localhost:3500")
    socketio.run(app, host="0.0.0.0", port=3500, debug=False, use_reloader=False)
