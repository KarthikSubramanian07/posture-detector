# reader.py
import time

def follow(file_path):
    with open(file_path, 'r') as f:
        f.seek(0, 2)  # Go to the end of file
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.5)  # wait for new data
                continue
            yield line

if __name__ == "__main__":
    print("Reader started — watching demo.log ...")
    for new_line in follow("demo.log"):
        print(f"[NEW LOG] {new_line.strip()}")
