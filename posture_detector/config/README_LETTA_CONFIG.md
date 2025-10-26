# Letta Agent Configuration Guide

This guide explains how to manage your Letta AI agent using the configuration file.

## Configuration File

All agent settings are stored in **`letta_agent_config.json`** in this directory.

## Quick Start

### Setup (Create or Update Agent)

```bash
cd posture_detector/api
python setup_letta_agent.py
```

This unified script will:
- ✓ Create a new agent if you don't have one
- ✓ Update existing agent if agent ID is found
- ✓ Read all settings from `config/letta_agent_config.json`
- ✓ Save the agent ID to your `.env.local` file automatically

**That's it!** The script handles both creation and updates.

### Update Agent Instructions Later

**Option A: Edit config and re-run script (Recommended)**

1. Edit `config/letta_agent_config.json`
2. Modify the `system_prompt` field
3. Run setup script again:
   ```bash
   python setup_letta_agent.py
   ```
   It will detect your existing agent and update it!

**Option B: Via Letta Dashboard**

1. Go to [letta.com](https://www.letta.com)
2. Find your "Posture Coach" agent
3. Edit instructions directly

## Configuration Options

### `system_prompt`
The main instructions for the AI agent. This controls:
- Tone and personality
- Response length
- What to focus on
- How to prioritize issues

**Example modifications:**

```json
{
  "system_prompt": "You are a strict posture coach. Be direct and critical. Focus only on the worst issue. 1 sentence max."
}
```

### `agent_name`
Display name for the agent (default: "Posture Coach")

### `model`
Which AI model to use:
- `"gpt-3.5-turbo"` - Fast, cheap (recommended)
- `"gpt-4"` - Better quality, more expensive
- `"gpt-4-turbo"` - Best balance

### `initial_message`
First message the agent sends when initialized

### `thresholds`
Define what constitutes good/bad/critical posture:

```json
{
  "thresholds": {
    "torsion_angle": {
      "ideal_min": 0,
      "ideal_max": 10,
      "bad": 15,
      "critical": 25
    }
  }
}
```

### `response_settings`
Control response behavior:

```json
{
  "response_settings": {
    "max_sentences": 3,
    "tone": "professional but friendly",
    "prioritize_critical": true,
    "max_issues_per_response": 2
  }
}
```

## Example Configurations

### Encouraging Coach
```json
{
  "system_prompt": "You are a supportive posture coach. Always start with positive reinforcement. Keep feedback to 2-3 sentences. Celebrate improvements and gently suggest corrections.",
  "response_settings": {
    "tone": "warm and encouraging"
  }
}
```

### Strict Trainer
```json
{
  "system_prompt": "You are a strict posture trainer. Be direct and critical. Focus on the single worst issue. Maximum 1 sentence.",
  "response_settings": {
    "max_sentences": 1,
    "tone": "direct and critical"
  }
}
```

### Medical Professional
```json
{
  "system_prompt": "You are an ergonomics specialist. Use medical terminology when appropriate. Explain the health impacts of poor posture. Provide evidence-based corrections.",
  "response_settings": {
    "max_sentences": 4,
    "tone": "professional and educational"
  }
}
```

## Testing Your Changes

After updating the config, test the agent:

```bash
# Update the agent
python update_letta_agent.py

# Start AI feedback service
python ai_feedback.py

# Test with sample data
curl -X POST http://localhost:5001/api/ai_feedback \
  -H "Content-Type: application/json" \
  -d '{"torsion_angle": 22.5, "depth_diff": 0.18}'
```

## Workflow

```
┌─────────────────────────────────────┐
│  Edit letta_agent_config.json      │
│  (change system_prompt, etc.)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  python setup_letta_agent.py        │
│  (creates or updates agent)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Agent immediately uses new config  │
│  (test with ai_feedback.py)         │
└─────────────────────────────────────┘
```

**One script does it all!** No need to worry about whether you're creating or updating.

## Version Control

The `letta_agent_config.json` file should be committed to git. This allows you to:
- Track changes to agent behavior over time
- Collaborate with teammates on prompt engineering
- Roll back to previous configurations if needed

## Best Practices

1. **Test incrementally** - Make small changes and test
2. **Keep prompts focused** - Don't make prompts too long
3. **Use examples** - Include 2-3 example responses in the prompt
4. **Set clear constraints** - Specify max length, tone, etc.
5. **Version control** - Commit config changes with descriptive messages

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Config file not found | Ensure `letta_agent_config.json` exists in `config/` directory |
| Invalid JSON | Validate JSON syntax at [jsonlint.com](https://jsonlint.com) |
| Update not taking effect | Restart `ai_feedback.py` after updating |
| Agent giving unexpected responses | Review `system_prompt` in config file |

## Advanced: Dynamic Prompts

You can programmatically modify the config before updating:

```python
import json

# Load config
with open('config/letta_agent_config.json', 'r') as f:
    config = json.load(f)

# Modify based on conditions
if user_preference == "strict":
    config["system_prompt"] = "Be strict and direct..."

# Save and update
with open('config/letta_agent_config.json', 'w') as f:
    json.dump(config, f, indent=2)

# Run update
os.system('python update_letta_agent.py')
```
