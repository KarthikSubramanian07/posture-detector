from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env.local or .env
env_local_path = Path(__file__).parent.parent / ".env.local"
env_path = Path(__file__).parent / ".env"

if env_local_path.exists():
    load_dotenv(env_local_path)
    print(f"✓ Loaded environment from {env_local_path.name}")
elif env_path.exists():
    load_dotenv(env_path)
    print(f"✓ Loaded environment from {env_path.name}")
else:
    load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Letta client (will be configured with API key)
try:
    from letta_client import Letta

    # Get API key from environment variable
    LETTA_API_KEY = os.environ.get("LETTA_API_KEY")

    if LETTA_API_KEY:
        letta_client = Letta(token=LETTA_API_KEY)
        print("✓ Letta AI client initialized successfully")
    else:
        letta_client = None
        print("⚠️ LETTA_API_KEY not found - AI feedback disabled")
except ImportError:
    letta_client = None
    print("⚠️ Letta client library not installed - run: pip install letta-client")


def generate_posture_feedback(metrics):
    """
    Generate AI-powered posture feedback using Letta AI.

    Args:
        metrics: Dictionary containing posture metrics
            - torsion_angle: Body twist angle
            - depth_diff: Forward head posture
            - face_angle: Head tilt
            - face_yaw_angle: Face rotation
            - chest_angle: Chest rotation
            - confidence: Confidence score (0.5-0.99) - optional

    Returns:
        String with personalized feedback tailored to confidence level
    """
    if not letta_client:
        return generate_fallback_feedback(metrics)

    try:
        # Calculate confidence if not provided
        confidence = metrics.get('confidence', 0.75)

        # Create a prompt for Letta AI including confidence score
        prompt = f"""Analyze these posture metrics and provide brief, friendly feedback (max 2-3 sentences):

Posture Metrics:
- Torsion angle: {metrics.get('torsion_angle', 0):.1f}° (ideal: 0-10°)
- Forward lean: {metrics.get('depth_diff', 0):.3f} (ideal: < 0.10)
- Head tilt: {metrics.get('face_angle', 0):.1f}° (ideal: -5° to 5°)
- Face rotation: {metrics.get('face_yaw_angle', 0):.1f}° (ideal: -15° to 15°)
- Chest rotation: {metrics.get('chest_angle', 0):.1f}° (ideal: < 10°)
- Confidence: {confidence:.2f} (how certain we are about this assessment)

Adjust your tone based on confidence: high confidence = direct and urgent, low confidence = gentle and suggestive."""

        # Send message to Letta agent using Letta 0.13.0 API
        agent_id = os.environ.get("LETTA_AGENT_ID")

        # For letta-client, use the HTTP API directly
        import requests

        # Get the base URL and token
        base_url = "https://api.letta.com"  # or your custom Letta server URL
        api_key = os.environ.get("LETTA_API_KEY")

        # Make direct API call to send message
        # Disable SSL verification for corporate proxy environments
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        http_response = requests.post(
            f"{base_url}/v1/agents/{agent_id}/messages",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "messages": [{"role": "user", "text": prompt}]
            },
            verify=False  # Disable SSL verification for corporate proxies
        )

        if http_response.status_code != 200:
            raise Exception(f"Letta API error: {http_response.status_code} - {http_response.text}")

        response_data = http_response.json()

        # Extract text from response
        # Letta API returns JSON with messages array
        feedback = None

        if isinstance(response_data, dict) and 'messages' in response_data:
            # Get the last assistant message from the messages list
            messages = response_data['messages']
            for msg in reversed(messages):
                if isinstance(msg, dict) and msg.get('role') == 'assistant':
                    feedback = msg.get('text') or msg.get('content')
                    if feedback:
                        break
            if not feedback and messages:
                feedback = str(messages[-1])
        elif isinstance(response_data, list) and len(response_data) > 0:
            # If response is directly a list of messages
            for msg in reversed(response_data):
                if isinstance(msg, dict) and msg.get('role') == 'assistant':
                    feedback = msg.get('text') or msg.get('content')
                    if feedback:
                        break
            if not feedback:
                feedback = str(response_data[-1])
        elif isinstance(response_data, dict) and ('text' in response_data or 'content' in response_data):
            feedback = response_data.get('text') or response_data.get('content')
        else:
            feedback = str(response_data)

        if not feedback:
            feedback = "Please adjust your posture for better ergonomics."

        return feedback

    except Exception as e:
        print(f"[ERROR] Letta AI failed: {e}")
        return generate_fallback_feedback(metrics)


def generate_fallback_feedback(metrics):
    """
    Generate rule-based feedback when AI is unavailable.
    """
    torsion = metrics.get('torsion_angle', 0)
    depth_diff = metrics.get('depth_diff', 0)
    face_angle = metrics.get('face_angle', 0)
    face_yaw = metrics.get('face_yaw_angle', 0)

    tips = []

    # Prioritize issues by severity
    if torsion > 25:
        tips.append(f"🔴 Critical: Your body is twisted {torsion:.0f}°. Rotate your torso to face your screen directly.")
    elif torsion > 15:
        tips.append(f"⚠️ Your torso is rotated {torsion:.0f}°. Straighten up to reduce strain.")

    if depth_diff > 0.18:
        tips.append(f"🔴 You're leaning far forward. Pull your head back and sit upright.")
    elif depth_diff > 0.12:
        tips.append(f"⚠️ Your head is leaning forward. Align your head with your spine.")

    if abs(face_angle) > 15:
        direction = "left" if face_angle < 0 else "right"
        tips.append(f"Your head is tilted {abs(face_angle):.0f}° to the {direction}. Level your head.")

    if abs(face_yaw) > 25:
        tips.append(f"You're looking sideways. Turn to face your screen directly.")

    # If posture is good
    if not tips:
        return "✓ Great posture! Keep it up. Remember to take breaks every 30 minutes."

    # Return top 2 tips
    return " ".join(tips[:2])


@app.route("/api/ai_feedback", methods=["POST"])
def get_ai_feedback():
    """
    Generate AI feedback for posture metrics.

    Request body:
    {
        "torsion_angle": 22.5,
        "depth_diff": 0.18,
        "face_angle": -12.3,
        "face_yaw_angle": -8.2,
        "chest_angle": 8.5,
        "confidence": 0.85  // Optional: 0.5-0.99, affects feedback urgency
    }

    Response includes confidence-adjusted feedback:
    - High confidence (0.90+): Direct, urgent tone
    - Medium confidence (0.70-0.89): Clear suggestions
    - Low confidence (0.50-0.69): Gentle, tentative advice
    """
    try:
        metrics = request.get_json()

        if not metrics:
            return jsonify({"error": "No metrics provided"}), 400

        feedback = generate_posture_feedback(metrics)

        return jsonify({
            "success": True,
            "feedback": feedback,
            "metrics": metrics,
            "using_ai": letta_client is not None
        })

    except Exception as e:
        print(f"[ERROR] Failed to generate feedback: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai_feedback/health", methods=["GET"])
def health_check():
    """Check if AI feedback service is working."""
    return jsonify({
        "status": "healthy",
        "letta_available": letta_client is not None,
        "letta_api_key_set": bool(os.environ.get("LETTA_API_KEY"))
    })


if __name__ == '__main__':
    print("Starting AI Feedback Service on http://localhost:5001")
    app.run(port=5001, debug=True)
