# Confidence-Based Feedback Guide

The AI posture coach adjusts its feedback tone and urgency based on the **confidence score** from the posture analysis system.

## Confidence Score Range: 0.5 - 0.99

The confidence score indicates how certain the system is about the posture assessment.

## How Confidence Affects Feedback

### Very High Confidence (0.90 - 0.99)
**Meaning:** System is very certain about the posture issue
**Tone:** Strong, direct, urgent
**Language:** Imperative commands

**Example:**
```
Input: torsion_angle=25°, confidence=0.95
Output: "Your torso is rotated 25° - straighten up to face your screen directly NOW. This is causing strain on your spine."
```

### High Confidence (0.70 - 0.89)
**Meaning:** System is confident about the assessment
**Tone:** Clear, suggestive
**Language:** Direct suggestions

**Example:**
```
Input: torsion_angle=22°, confidence=0.75
Output: "Your torso is rotated 22° - try straightening up to face your screen. Also consider pulling your head back to align with your spine."
```

### Medium Confidence (0.50 - 0.69)
**Meaning:** System has some uncertainty
**Tone:** Gentle, tentative
**Language:** Soft suggestions, qualifiers

**Example:**
```
Input: torsion_angle=18°, confidence=0.60
Output: "You may be leaning forward slightly. Try sitting back in your chair and aligning your head with your spine."
```

## Configuration

Confidence thresholds are defined in `letta_agent_config.json`:

```json
{
  "thresholds": {
    "confidence": {
      "very_high": 0.90,
      "high": 0.70,
      "medium": 0.50
    }
  },
  "response_settings": {
    "confidence_based_urgency": {
      "enabled": true,
      "very_high_tone": "strong and direct",
      "high_tone": "clear and suggestive",
      "medium_tone": "gentle and tentative"
    }
  }
}
```

## How Confidence is Calculated

From `app.py`:

```python
if torsion_angle < 15:
    status = "correct"
    confidence = 1.0 - (torsion_angle / 15.0)
else:
    status = "incorrect"
    confidence = min(1.0, (torsion_angle - 15) / 30.0)

confidence = max(0.5, min(0.99, confidence))  # Clamped 0.5-0.99
```

**For correct posture:**
- Perfect posture (0°) → confidence = 1.0
- Almost incorrect (14°) → confidence = 0.07 → clamped to 0.5

**For incorrect posture:**
- Just incorrect (15°) → confidence = 0.0 → clamped to 0.5
- Very bad (45°+) → confidence = 1.0 → clamped to 0.99

## Example API Request

```bash
curl -X POST http://localhost:5001/api/ai_feedback \
  -H "Content-Type: application/json" \
  -d '{
    "torsion_angle": 25.0,
    "depth_diff": 0.18,
    "face_angle": -12.3,
    "confidence": 0.92
  }'
```

**Response with high confidence:**
```json
{
  "success": true,
  "feedback": "Your torso is rotated 25° - straighten up NOW to face your screen. You're also leaning forward - pull your head back immediately.",
  "using_ai": true
}
```

**Same metrics with low confidence:**
```json
{
  "success": true,
  "feedback": "You might be leaning forward a bit. Consider sitting back and aligning your posture.",
  "using_ai": true
}
```

## Best Practices

1. **Always include confidence** in API requests for better feedback
2. **Higher confidence for clear issues** - severe posture problems should have high confidence
3. **Lower confidence for edge cases** - borderline posture should have medium confidence
4. **Tune thresholds** in config file based on user feedback

## Customizing Tone

Edit `letta_agent_config.json` to adjust tones:

```json
{
  "response_settings": {
    "confidence_based_urgency": {
      "very_high_tone": "extremely urgent and alarming",
      "high_tone": "firm but supportive",
      "medium_tone": "encouraging and gentle"
    }
  }
}
```

Then run:
```bash
python update_letta_agent.py
```

The agent will immediately use the new tone settings!
