
import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template
from flask_socketio import SocketIO
import os, re, time, threading

BASE_DIR = os.path.dirname(__file__)
LOG_DIR = os.path.join(BASE_DIR, "logs")

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static")
)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

def get_latest_log():
    files = [
        os.path.join(LOG_DIR, f)
        for f in os.listdir(LOG_DIR)
        if f.startswith("posture_") and f.endswith(".log")
    ]
    return max(files, key=os.path.getctime) if files else None

def parse_log(path):
    pattern = re.compile(
        r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ - user=(\w+) posture=(\w+) confidence=([\d.]+)"
    )
    entries = []
    with open(path) as f:
        for line in f:
            m = pattern.search(line)
            if m:
                t,u,p,c = m.groups()
                entries.append({
                    "timestamp": t, "user": u,
                    "posture": p, "confidence": float(c)
                })
    return entries

def get_dashboard_data():
    log = get_latest_log()
    if not log:
        return None
    entries = parse_log(log)
    ts = [e["timestamp"] for e in entries]
    cf = [e["confidence"] for e in entries]
    correct = [1 if e["posture"]=="correct" else 0 for e in entries]
    acc = sum(correct)/len(correct)*100 if correct else 0
    return {
        "log_name": os.path.basename(log),
        "entries": entries[-50:],
        "timestamps": ts[-50:],
        "confidences": cf[-50:],
        "accuracy": round(acc,2)
    }

@app.route("/")
def dashboard():
    data = get_dashboard_data()
    if not data:
        return "<h2>No log files found in /logs directory.</h2>"
    return render_template("dashboard.html", **data)

def watch_logs():
    last_state = None
    while True:
        log = get_latest_log()
        if not log:
            time.sleep(2)
            continue
        try:
            content = open(log).read()
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

if __name__ == "__main__":
    os.makedirs(LOG_DIR, exist_ok=True)
    print("✅ Server starting with Eventlet on http://localhost:3500")
    socketio.run(app, host="0.0.0.0", port=3500, debug=False, use_reloader=False)
