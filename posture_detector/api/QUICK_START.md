# Quick Start: Letta AI Posture Feedback

Follow these steps to set up AI-powered posture feedback in 5 minutes.

## Prerequisites

- Conda environment (`posture_env`)
- Letta AI account (free signup at [letta.com](https://www.letta.com))

## Setup Steps

### 1️⃣ Update Environment

```bash
conda activate posture_env
cd posture_detector/api
conda env update -f minimal_env.yaml --prune
```

### 2️⃣ Get Letta API Key

1. Go to [letta.com](https://www.letta.com)
2. Sign up / Log in
3. Copy your API key from the dashboard

### 3️⃣ Configure Environment

```bash
# Create .env file from template
copy .env.template .env

# Edit .env and add your API key
notepad .env
```

Add this line:
```
LETTA_API_KEY=your-api-key-here
```

### 4️⃣ Setup Posture Coach Agent

```bash
python setup_letta_agent.py
```

This script will:
- ✓ Create a new agent if none exists
- ✓ Update existing agent if you have one
- ✓ Save agent ID to .env.local automatically
- ✓ Load all settings from config file

### 5️⃣ Start Services

**Terminal 1 - Metrics API (already running):**
```bash
python get_metrics.py
# Runs on http://localhost:5000
```

**Terminal 2 - AI Feedback API:**
```bash
python ai_feedback.py
# Runs on http://localhost:5001
```

### 6️⃣ Test It

```bash
# Test the health endpoint
curl http://localhost:5001/api/ai_feedback/health

# Test feedback generation
curl -X POST http://localhost:5001/api/ai_feedback \
  -H "Content-Type: application/json" \
  -d "{\"torsion_angle\": 22.5, \"depth_diff\": 0.18}"
```

Expected response:
```json
{
  "success": true,
  "feedback": "Your torso is rotated 22° - straighten up to face your screen. You're also leaning forward - pull your head back.",
  "using_ai": true
}
```

## Integration Example

### JavaScript/TypeScript Frontend

```javascript
// 1. Get posture metrics
const metrics = await fetch('http://127.0.0.1:5000/api/get_metrics?id=1');
const data = await metrics.json();

// 2. Get AI feedback
const response = await fetch('http://localhost:5001/api/ai_feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

const result = await response.json();

// 3. Show feedback to user
console.log(result.feedback);
// "Your torso is rotated 22° - straighten up to face your screen..."
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `LETTA_API_KEY not found` | Add API key to `.env` file |
| `Letta library not installed` | Run `conda env update -f minimal_env.yaml --prune` |
| `Agent creation failed` | Check API key is valid and has quota |
| `AI feedback disabled` | Verify `.env` has both `LETTA_API_KEY` and `LETTA_AGENT_ID` |
| Fallback mode always used | Restart `ai_feedback.py` after setting environment variables |

## What's Next?

✅ Your AI feedback system is ready!

- Integrate into your UI (see AI_FEEDBACK_SETUP.md)
- Customize agent prompts (edit create_letta_agent.py)
- Monitor API usage in Letta dashboard
- Add caching to reduce API calls

## Files Created

```
posture_detector/api/
├── create_letta_agent.py    # Agent setup script (run once)
├── ai_feedback.py            # AI feedback API service
├── .env.template             # Environment template
├── .env                      # Your config (gitignored)
├── AI_FEEDBACK_SETUP.md      # Detailed docs
└── QUICK_START.md           # This file
```

## Support

- Letta Docs: [docs.letta.com](https://docs.letta.com)
- Issues: Check AI_FEEDBACK_SETUP.md troubleshooting section
