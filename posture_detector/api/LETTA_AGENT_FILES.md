# Letta Agent Files Reference

## Summary

All Letta agent setup has been unified into **one script** and **one config file**.

## Files

### 🚀 Main Script (Use This!)

**`setup_letta_agent.py`** - Unified create/update script
- ✅ Creates new agent if none exists
- ✅ Updates existing agent if found
- ✅ Reads from config file
- ✅ Saves agent ID automatically
- ✅ One script for everything

**Usage:**
```bash
python setup_letta_agent.py
```

### ⚙️ Configuration

**`config/letta_agent_config.json`** - All agent settings
- System prompt (instructions)
- Model selection
- Thresholds for metrics
- Response settings
- Confidence-based urgency

**To change agent behavior:**
1. Edit this file
2. Run `setup_letta_agent.py`
3. Done!

### 📚 Documentation

- **`AI_FEEDBACK_SETUP.md`** - Complete setup guide
- **`QUICK_START.md`** - 5-minute quick start
- **`config/README_LETTA_CONFIG.md`** - Config file guide
- **`config/CONFIDENCE_GUIDE.md`** - How confidence affects feedback
- **`LETTA_AGENT_FILES.md`** - This file

### 🗂️ Legacy Files (Not Needed)

These files are kept for reference but you don't need to use them:

- ~~`create_letta_agent.py`~~ - Use `setup_letta_agent.py` instead
- ~~`update_letta_agent.py`~~ - Use `setup_letta_agent.py` instead

## Quick Reference

### First Time Setup

```bash
# 1. Add API key to .env.local
echo "LETTA_API_KEY=your-key" >> .env.local

# 2. Run setup
python setup_letta_agent.py

# 3. Start service
python ai_feedback.py
```

### Update Agent Instructions

```bash
# 1. Edit config
nano config/letta_agent_config.json

# 2. Run setup (it detects existing agent and updates)
python setup_letta_agent.py

# Done! Changes apply immediately
```

### Test Agent

```bash
curl -X POST http://localhost:5001/api/ai_feedback \
  -H "Content-Type: application/json" \
  -d '{
    "torsion_angle": 22.5,
    "depth_diff": 0.18,
    "confidence": 0.85
  }'
```

## File Structure

```
posture_detector/
├── api/
│   ├── setup_letta_agent.py      ⭐ Main setup script
│   ├── ai_feedback.py             ⭐ AI feedback service
│   ├── AI_FEEDBACK_SETUP.md       📖 Setup guide
│   ├── QUICK_START.md             📖 Quick start
│   └── LETTA_AGENT_FILES.md       📖 This file
└── config/
    ├── letta_agent_config.json    ⚙️ Agent configuration
    ├── README_LETTA_CONFIG.md     📖 Config guide
    └── CONFIDENCE_GUIDE.md        📖 Confidence info
```

## Common Tasks

| Task | Command |
|------|---------|
| Create new agent | `python setup_letta_agent.py` |
| Update existing agent | `python setup_letta_agent.py` (same!) |
| Change instructions | Edit config → run setup script |
| Test agent | `python ai_feedback.py` then curl |
| Check agent ID | `echo $LETTA_AGENT_ID` |
| View config | `cat config/letta_agent_config.json` |

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `LETTA_API_KEY` | `.env.local` | Your Letta API key |
| `LETTA_AGENT_ID` | `.env.local` | Auto-saved agent ID |

## Workflow Diagram

```
First Time:                    Updates:

┌─────────────────┐           ┌─────────────────┐
│ Add LETTA_API_  │           │ Edit config/    │
│ KEY to .env     │           │ letta_agent_    │
└────────┬────────┘           │ config.json     │
         │                    └────────┬────────┘
         ▼                             │
┌─────────────────┐                   │
│ python setup_   │◄──────────────────┘
│ letta_agent.py  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Agent ready!    │
│ Start service   │
└─────────────────┘
```

## Key Benefits

✅ **One script** - No confusion about create vs update
✅ **Config-driven** - All settings in one JSON file
✅ **Auto-detect** - Knows if agent exists
✅ **Auto-save** - Agent ID saved automatically
✅ **Simple workflow** - Edit config → run script → done

## Support

- Letta Docs: [docs.letta.com](https://docs.letta.com)
- Issues: See troubleshooting in `AI_FEEDBACK_SETUP.md`
- Questions: Check `config/README_LETTA_CONFIG.md`
