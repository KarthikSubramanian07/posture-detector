# AI Feedback Setup Guide

This guide explains how to set up Letta AI-powered posture feedback for your application.

## Features

- **AI-Powered Feedback**: Uses Letta AI to generate personalized, conversational posture tips
- **Fallback System**: If Letta AI is unavailable, uses rule-based feedback
- **REST API**: Easy integration via HTTP endpoints

## Installation

### 1. Update Your Conda Environment

The required packages are already in `minimal_env.yaml`. Update your environment:

```bash
conda env update -f minimal_env.yaml --prune
```

This installs:
- `letta` - Letta AI SDK
- `python-dotenv` - Environment variable management

### 2. Get Letta API Key

1. Sign up at [letta.com](https://www.letta.com)
2. Get your API key from the dashboard

### 3. Create the Posture Coach Agent

We've provided an automated script to create and configure the agent:

**Step 1:** Create a `.env` file from the template:
```bash
cd posture_detector/api
copy .env.template .env
```

**Step 2:** Edit `.env` and add your API key:
```
LETTA_API_KEY=your-actual-api-key-here
```

**Step 3:** Run the agent setup script:
```bash
python setup_letta_agent.py
```

The script will:
- Create a new agent OR update existing one automatically
- Configure it with settings from `config/letta_agent_config.json`
- Save the agent ID to your `.env.local` file
- Show you the agent details

**Output:**
```
✓ Connected to Letta API
✓ Agent created successfully!
📋 AGENT DETAILS:
   Name: Posture Coach
   Agent ID: agent-abc123xyz
   Model: gpt-3.5-turbo

✅ SETUP COMPLETE!
```

**To update later:** Just edit `config/letta_agent_config.json` and run the same script again!

## Running the Service

### Start the AI Feedback Server

```bash
cd posture_detector/api
python ai_feedback.py
```

The service will run on `http://localhost:5001`

### Health Check

```bash
curl http://localhost:5001/api/ai_feedback/health
```

Response:
```json
{
  "status": "healthy",
  "letta_available": true,
  "letta_api_key_set": true
}
```

## API Usage

### Generate Feedback

**Endpoint:** `POST /api/ai_feedback`

**Request:**
```json
{
  "torsion_angle": 22.5,
  "depth_diff": 0.18,
  "face_angle": -12.3,
  "face_yaw_angle": -8.2,
  "chest_angle": 8.5
}
```

**Response:**
```json
{
  "success": true,
  "feedback": "Your body is rotated 22° - straighten your torso to face the screen. You're also leaning forward quite a bit - pull your head back to align with your spine.",
  "metrics": {...},
  "using_ai": true
}
```

### Example Integration (JavaScript)

```javascript
async function getPostureFeedback(metrics) {
  const response = await fetch('http://localhost:5001/api/ai_feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metrics)
  });

  const data = await response.json();
  return data.feedback;
}

// Usage
const metrics = await fetch('http://127.0.0.1:5000/api/get_metrics?id=1');
const metricsData = await metrics.json();
const feedback = await getPostureFeedback(metricsData);
console.log(feedback);
```

## Fallback Mode

If Letta AI is not configured or fails, the system automatically uses rule-based feedback:

- ✅ No API key needed
- ✅ Works offline
- ✅ Fast response
- ⚠️ Less personalized

## Customizing the AI Agent

You can customize your Letta agent's personality and response style:

1. Go to your Letta dashboard
2. Edit your agent's system prompt:

```
You are a friendly posture coach. Analyze posture metrics and provide:
- Brief, actionable advice (2-3 sentences max)
- Encouraging but direct tone
- Focus on the most critical issues first
- Use emojis sparingly for emphasis
```

## Integration with Your UI

In your React/Next.js component:

```typescript
const PostureFeedback = ({ frameNumber }) => {
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const getFeedback = async () => {
      // Get metrics from your existing API
      const metrics = await fetch(`http://127.0.0.1:5000/api/get_metrics?id=${frameNumber}`);
      const data = await metrics.json();

      // Get AI feedback
      const response = await fetch('http://localhost:5001/api/ai_feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      setFeedback(result.feedback);
    };

    getFeedback();
  }, [frameNumber]);

  return (
    <div className="posture-feedback">
      {feedback}
    </div>
  );
};
```

## Troubleshooting

### "Letta library not installed"
Run: `pip install letta`

### "LETTA_API_KEY not found"
Set the environment variable as shown above

### "AI feedback disabled"
Check that both `LETTA_API_KEY` and `LETTA_AGENT_ID` are set

### Letta API errors
- Verify your API key is valid
- Check your Letta account quota/limits
- Ensure your agent ID is correct

## Cost Considerations

Letta AI pricing depends on usage. For cost optimization:
- Cache feedback for similar posture states
- Use fallback mode for good posture (no feedback needed)
- Set rate limits on the endpoint
