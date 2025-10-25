import subprocess
import json
import random
import time

def simulate_js_call(status):
    """Simulate one JavaScript call to your Python script."""
    proc = subprocess.Popen(
        ["python", "data_handler.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # send data
    out, err = proc.communicate(json.dumps({"posture_status": status}))
    print("Python API returned:", out.strip())
    if err:
        print("Error:", err.strip())

# simulate random posture updates
for _ in range(5):
    status = random.choice(["correct", "incorrect"])
    print(f"Simulating JS call with posture_status={status}")
    simulate_js_call(status)
    time.sleep(1)
