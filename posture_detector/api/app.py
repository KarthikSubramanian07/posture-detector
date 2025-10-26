import eventlet
eventlet.monkey_patch()
import ast

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
import os, re, time, threading, json, logging
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).parent
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static")
)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

timestamp_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
LOG_FILE = LOG_DIR / f"posture_{timestamp_str}.log"

logger = logging.getLogger("posture_data")
logger.setLevel(logging.INFO)
handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
formatter = logging.Formatter("%(asctime)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)


def log_posture(status: str, neck_strain: float, eye_strain: float, posture: int):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = (
        f"user=system posture_status={status} posture={posture} "
        f"neck_strain={neck_strain:.2f} eye_strain={eye_strain:.2f}"
    )
    logger.info(log_line)
    return {
        "timestamp": timestamp,
        "status": status,
        "posture": posture,
        "neck_strain": neck_strain,
        "eye_strain": eye_strain,
    }


def get_latest_log():
    files = [LOG_DIR / f for f in os.listdir(LOG_DIR) if f.startswith("posture_") and f.endswith(".log")]
    return max(files, key=os.path.getctime) if files else None


def parse_log(path):
    pattern = re.compile(
        r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ - user=(\w+) posture_status=(\w+) posture=(\d+) neck_strain=([\d.]+) eye_strain=([\d.]+)"
    )
    entries = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = pattern.search(line)
            if m:
                t, u, s, p, n, e = m.groups()
                entries.append({
                    "timestamp": t,
                    "user": u,
                    "status": s,
                    "posture": int(p),
                    "neck_strain": float(n),
                    "eye_strain": float(e)
                })
    return entries


def get_dashboard_data():
    log = get_latest_log()
    if not log:
        return None
    entries = parse_log(log)
    ts = [e["timestamp"] for e in entries]
    neck = [e["neck_strain"] for e in entries]
    eye = [e["eye_strain"] for e in entries]

    # ✅ Calculate rolling correctness %
    correct_count = 0
    percentages = []
    for i, e in enumerate(entries):
        if e["status"] == "correct":
            correct_count += 1
        percentages.append(round(correct_count / (i + 1) * 100, 2))

    latest = entries[-1] if entries else {"neck_strain": 0, "eye_strain": 0}
    accuracy = percentages[-1] if percentages else 0.0  # last rolling % for display

    return {
        "log_name": log.name,
        "entries": entries[-50:],
        "timestamps": ts[-50:],
        "neck_strain": neck[-50:],
        "eye_strain": eye[-50:],
        "correctness_percent": percentages[-50:],  # ✅ for chart
        "accuracy": accuracy,                      # ✅ for display
        "latest_neck": latest["neck_strain"],
        "latest_eye": latest["eye_strain"],
    }



@app.route("/")
def dashboard():
    data = get_dashboard_data()
    if not data:
        return "<h2>No log files found in /logs directory.</h2>"
    return render_template("dashboard.html", **data)



#anti dummy functions
@app.route("/api/app.py", methods=["POST", "GET"])
def api_log():
    try:
        raw_data = ""
        data = None

        # --------------------------
        # 1️⃣ JSON body
        # --------------------------
        if request.is_json:
            data = request.get_json(silent=True)
            if data:
                print("[DEBUG] Parsed as JSON body ✅")

        # --------------------------
        # 2️⃣ Raw body
        # --------------------------
        if not data and request.data:
            raw_data = request.data.decode("utf-8").strip()
            print(f"[DEBUG] Raw body: {raw_data}")

            # Try JSON
            try:
                data = json.loads(raw_data)
                print("[DEBUG] Parsed raw body as JSON ✅")
            except Exception:
                pass

            # Try Python dict
            if not data:
                try:
                    data = ast.literal_eval(raw_data)
                    print("[DEBUG] Parsed raw body as Python literal ✅")
                except Exception:
                    pass

            # Try URL-encoded (key=value&key=value)
            if not data and "=" in raw_data:
                try:
                    parsed = urllib.parse.parse_qs(raw_data, keep_blank_values=True)
                    # Flatten single-item lists
                    data = {k: v[0] if isinstance(v, list) and len(v) == 1 else v for k, v in parsed.items()}
                    print("[DEBUG] Parsed raw body as query string ✅")
                except Exception:
                    pass

            # Try semicolon separated (key:val;key:val)
            if not data and ";" in raw_data and ":" in raw_data:
                try:
                    parts = [p for p in raw_data.split(";") if ":" in p]
                    data = {k.strip(): v.strip() for k, v in (p.split(":", 1) for p in parts)}
                    print("[DEBUG] Parsed raw body as semicolon syntax ✅")
                except Exception:
                    pass

            # Try bare dict {neck-strain:10, eye-strain:50, posture:1}
            if not data and raw_data.startswith("{") and "}" in raw_data:
                try:
                    cleaned = raw_data.replace("{", "").replace("}", "")
                    kv_pairs = [p.strip() for p in cleaned.split(",") if ":" in p]
                    data = {k.strip(): v.strip() for k, v in (pair.split(":", 1) for pair in kv_pairs)}
                    print("[DEBUG] Parsed bare dict-style body ✅")
                except Exception:
                    pass

        # --------------------------
        # 3️⃣ Query string (?key=value)
        # --------------------------
        if not data:
            if request.args:
                data = request.args.to_dict()
                print("[DEBUG] Parsed query args ✅")
            elif request.query_string:
                raw_qs = request.query_string.decode("utf-8").strip()
                try:
                    if raw_qs.startswith("{"):
                        data = ast.literal_eval(raw_qs)
                        print("[DEBUG] Parsed query string literal ✅")
                    else:
                        parsed = urllib.parse.parse_qs(raw_qs, keep_blank_values=True)
                        data = {k: v[0] if isinstance(v, list) and len(v) == 1 else v for k, v in parsed.items()}
                        print("[DEBUG] Parsed weird query string ✅")
                except Exception as e:
                    print("[DEBUG] Query parse fail ❌", e)

        # --------------------------
        # 4️⃣ Still nothing?
        # --------------------------
        if not data:
            print("[DEBUG] No data received at all ❌")
            return jsonify({"error": "No valid payload received"}), 400

        # --------------------------
        # 5️⃣ Normalize values
        # --------------------------
        def safe_float(x):
            try:
                return float(x)
            except:
                return 0.0

        def safe_int(x):
            try:
                return int(float(x))
            except:
                return 0

        neck = safe_float(data.get("neck-strain") or data.get("neck_strain") or 0)
        eye = safe_float(data.get("eye-strain") or data.get("eye_strain") or 0)
        posture = safe_int(data.get("posture") or 0)
        status = "correct" if posture == 1 else "incorrect"

        # --------------------------
        # 6️⃣ Log and emit
        # --------------------------
        result = log_posture(status, neck, eye, posture)
        socketio.emit("update", get_dashboard_data())
        print(f"[API] Logged {status.upper()} → neck={neck:.2f}, eye={eye:.2f}, posture={posture}")

        return jsonify(result)

    except Exception as e:
        print("[FATAL API ERROR]", e)
        return jsonify({"error": str(e)}), 500

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

if __name__ == "__main__":
    print("✅ Server starting with Eventlet on http://localhost:3500")
    socketio.run(app, host="0.0.0.0", port=3500, debug=True, use_reloader=False)
