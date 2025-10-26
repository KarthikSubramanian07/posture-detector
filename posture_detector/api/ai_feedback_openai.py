"""
AI Feedback using OpenAI API directly (alternative to Letta)

This bypasses Letta and uses OpenAI's API directly.
Works better with corporate proxies.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Try to import OpenAI
try:
    from openai import OpenAI
    openai_available = True
except ImportError:
    openai_available = False
    print("⚠️ OpenAI library not installed - run: pip install openai")

# Load config
CONFIG_PATH = Path(__file__).parent.parent / "config" / "letta_agent_config.json"
try:
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        AGENT_CONFIG = json.load(f)
    SYSTEM_PROMPT = AGENT_CONFIG.get("system_prompt", "You are a posture coach.")
except:
    SYSTEM_PROMPT = "You are a posture coach. Provide brief feedback on posture metrics."

# Initialize OpenAI client
openai_client = None
if openai_available:
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        openai_client = OpenAI(api_key=api_key)
        print("✓ OpenAI client initialized")
    else:
        print("⚠️ OPENAI_API_KEY not found")


def generate_posture_feedback_openai(metrics):
    """Generate feedback using OpenAI API directly."""
    if not openai_client:
        return generate_fallback_feedback(metrics)

    try:
        confidence = metrics.get('confidence', 0.75)

        # Create prompt
        user_message = f"""Analyze these posture metrics and provide brief feedback (2-3 sentences):

Metrics:
- Torsion angle: {metrics.get('torsion_angle', 0):.1f}° (ideal: 0-10°)
- Forward lean: {metrics.get('depth_diff', 0):.3f} (ideal: < 0.10)
- Head tilt: {metrics.get('face_angle', 0):.1f}° (ideal: -5° to 5°)
- Face rotation: {metrics.get('face_yaw_angle', 0):.1f}° (ideal: -15° to 15°)
- Confidence: {confidence:.2f}

Adjust urgency based on confidence (higher = more direct)."""

        # Call OpenAI
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            max_tokens=150,
            temperature=0.7
        )

        feedback = response.choices[0].message.content
        return feedback

    except Exception as e:
        print(f"[ERROR] OpenAI failed: {e}")
        return generate_fallback_feedback(metrics)


def generate_fallback_feedback(metrics):
    """Rule-based feedback when AI unavailable."""
    torsion = metrics.get('torsion_angle', 0)
    depth_diff = metrics.get('depth_diff', 0)

    tips = []
    if torsion > 25:
        tips.append(f"Your body is twisted {torsion:.0f}°. Straighten your torso NOW.")
    elif torsion > 15:
        tips.append(f"Your torso is rotated {torsion:.0f}°. Try straightening up.")

    if depth_diff > 0.18:
        tips.append("You're leaning far forward. Pull your head back.")
    elif depth_diff > 0.12:
        tips.append("You're leaning forward. Align your head with your spine.")

    if not tips:
        return "Great posture! Keep it up."

    return " ".join(tips[:2])


@app.route("/api/ai_feedback", methods=["POST"])
def get_ai_feedback():
    """Generate AI feedback for posture metrics."""
    try:
        metrics = request.get_json()

        if not metrics:
            return jsonify({"error": "No metrics provided"}), 400

        feedback = generate_posture_feedback_openai(metrics)

        return jsonify({
            "success": True,
            "feedback": feedback,
            "metrics": metrics,
            "using_ai": openai_client is not None
        })

    except Exception as e:
        print(f"[ERROR] Failed to generate feedback: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/ai_feedback/health", methods=["GET"])
def health_check():
    """Check if AI feedback service is working."""
    return jsonify({
        "status": "healthy",
        "openai_available": openai_client is not None,
        "method": "OpenAI Direct API"
    })


if __name__ == '__main__':
    print("Starting AI Feedback Service (OpenAI Direct) on http://localhost:5001")
    app.run(port=5001, debug=True)
