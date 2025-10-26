import requests
import json

BASE_URL = "http://localhost:3500/api/app.py"

# Dumb payloads from most correct → most cursed
payloads = [
    # 1️⃣ Proper JSON (what normal people would do)
    {"neck-strain": 12.34, "eye-strain": 0.98, "posture": 1},

    # 2️⃣ JSON but sent as string (double quotes)
    '{"neck-strain": 15.00, "eye-strain": 0.77, "posture": 0}',

    # 3️⃣ Stringified Python dict (single quotes)
    "{'neck-strain': 10.00, 'eye-strain': 50.92, 'posture': 0}",

    # 4️⃣ Query string format
    "neck-strain=25&eye-strain=75.5&posture=1",

    # 5️⃣ JSON-ish but missing quotes entirely (bare keys)
    "{neck-strain:10, eye-strain:50, posture:1}",

    # 6️⃣ Sent as literal garbage but still kind of looks like data
    "neck-strain:99;eye-strain:42;posture:0",

    # 7️⃣ Query string literal inside URL
    "?{'neck-strain':22,'eye-strain':33.3,'posture':1}",

    # 8️⃣ Absolutely feral nonsense
    "ThisIsNotEvenJSONButIDareYouToParseIt"
]

def post_and_print(url, payload=None, send_as_json=False):
    try:
        if send_as_json and isinstance(payload, dict):
            response = requests.post(url, json=payload)
            method = "JSON"
        elif isinstance(payload, dict):
            # send as form-urlencoded (rarely used here)
            response = requests.post(url, data=payload)
            method = "FORM"
        elif isinstance(payload, str):
            # send raw string as body
            response = requests.post(url, data=payload)
            method = "RAW STRING"
        else:
            # default fallback
            response = requests.post(url)
            method = "EMPTY"

        print(f"\n🔹 Method: {method}")
        print(f"🔹 Payload: {payload}")
        print(f"🔹 Status: {response.status_code}")
        print(f"🔹 Response: {response.text}\n")

    except Exception as e:
        print(f"💥 Failed ({payload}): {e}")

if __name__ == "__main__":
    print("🚀 Starting idiot-proof API stress test...\n")

    # 1️⃣ Test proper JSON
    post_and_print(BASE_URL, payloads[0], send_as_json=True)

    # 2️⃣ Send each weird payload variant
    for p in payloads[1:]:
        # If the payload starts with '?', append directly to URL
        if isinstance(p, str) and p.startswith("?"):
            full_url = BASE_URL + p
            post_and_print(full_url)
        else:
            post_and_print(BASE_URL, p)

    print("\n✅ Test complete — check your Flask console logs.")
