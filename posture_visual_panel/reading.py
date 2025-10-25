# reader.py
import time

def follow(file_path):
    with open(file_path, 'r') as f:
        f.seek(0, 2)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.3)
                continue
            yield line

for line in follow("posture_data.log"):
    print(f"[LOG] {line.strip()}")
