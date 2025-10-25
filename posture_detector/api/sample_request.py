import requests

url = "http://localhost:3500/api/app.py"

# Example payload (can be "correct" or "incorrect")
payload = {
    "status": "correct",
    "confidence": 0.92
}

try:
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        print("✅ Successfully logged:")
        print(response.json())
    else:
        print(f"❌ Error {response.status_code}: {response.text}")
except Exception as e:
    print("⚠️ Request failed:", e)
