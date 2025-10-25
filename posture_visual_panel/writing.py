# writer.py
import time
import logging

# Configure the logger
logger = logging.getLogger("demo_logger")
logger.setLevel(logging.INFO)

# Write logs to a file called "demo.log"
handler = logging.FileHandler("demo.log", mode='a')
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)

# Continuously write logs
i = 0
print("Writer started — writing logs to demo.log ...")
while True:
    i += 1
    logger.info(f"Log message number {i}")
    time.sleep(2)  # every 2 seconds
