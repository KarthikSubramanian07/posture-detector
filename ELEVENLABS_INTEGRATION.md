# ElevenLabs Text-to-Speech Integration Documentation

## Overview

This project integrates **ElevenLabs Text-to-Speech API** to provide real-time voice alerts for posture correction. When bad posture is detected (posture score = 0), the system generates personalized AI feedback and speaks it aloud using ElevenLabs' natural-sounding voice synthesis.

---

## Architecture

### Integration Flow

```
┌─────────────────┐
│  Bad Posture    │
│   Detected      │
│ (posture === 0) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Feedback    │
│   Generated     │
│  (Letta AI)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Voice Alert    │
│   Triggered     │
│  (speakText)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Next.js API   │
│     Route       │
│  /api/speak     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ElevenLabs     │
│   TTS API       │
│ v1/text-to-speech│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MP3 Audio     │
│   Returned      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Browser Audio  │
│   Playback      │
└─────────────────┘
```

---

## Implementation Details

### 1. API Route (`/api/speak`)

**Location:** `posture_detector/app/api/speak/route.ts`

**Purpose:** Server-side proxy that communicates with ElevenLabs API and returns audio to the client.

**Key Features:**
- Accepts text input from client
- Authenticates with ElevenLabs using API key
- Requests audio generation using specified voice and model
- Returns MP3 audio stream to client
- Includes error handling and logging

**Endpoint Details:**
```typescript
POST /api/speak
Content-Type: application/json

Request Body:
{
  "text": "Please adjust your posture..."
}

Response:
- Content-Type: audio/mpeg
- Body: Binary MP3 audio data
```

**Configuration:**
- **API Endpoint:** `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}`
- **Model:** `eleven_turbo_v2_5` (Fast model with good quality, optimized for low latency)
- **Voice ID:** `EXAVITQu4vr4xnSDxMaL` (Sarah - default voice)
- **Voice Settings:**
  - Stability: `0.5`
  - Similarity Boost: `0.75`

---

### 2. Client-Side Integration

**Location:** `posture_detector/components/PosturePalRoom.tsx`

**Function:** `speakText(text: string)`

**Purpose:** Requests voice synthesis from the API and plays the audio in the browser.

**Features:**
- **Cooldown mechanism:** 60-second cooldown between voice alerts (configurable)
- **Concurrent playback prevention:** Blocks new audio requests while audio is playing
- **Resource cleanup:** Revokes object URLs after playback
- **Error handling:** Graceful failure with console logging

**Implementation:**
```typescript
const speakText = async (text: string) => {
  // Check cooldown and playback state
  if (isPlayingAudioRef.current || withinCooldown) {
    return; // Skip
  }

  // Fetch audio from API
  const response = await fetch('/api/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  // Play audio
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  await audio.play();
};
```

**Trigger Condition:**
```typescript
if (metricsData.posture === 0) {
  const feedback = await getAIFeedback(metricsData);
  speakText(feedback || 'Please adjust your posture');
}
```

---

## Configuration

### Environment Variables

**Location:** `.env.local`

```env
# Required: Your ElevenLabs API Key
ELEVENLABS_API_KEY=sk_your_api_key_here

# Optional: Voice ID (defaults to Sarah voice if not set)
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

**Obtaining API Key:**
1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Navigate to Profile → API Keys
3. Generate or copy your API key (starts with `sk_`)
4. Add to `.env.local`
5. Restart Next.js development server

---

### Application Configuration

**Location:** `posture_detector/config/app.config.ts`

```typescript
alerts: {
  voiceAlert: {
    enabled: true,
    cooldownSeconds: 60, // Cooldown between voice alerts
  },
}
```

**Adjustable Parameters:**
- `enabled`: Toggle voice alerts on/off
- `cooldownSeconds`: Time between voice alerts (prevents spam)

---

## Voice Selection

### Available Voices

ElevenLabs offers 3,000+ voices across 32 languages. You can browse and select voices:

**Via Web Interface:**
- Visit [elevenlabs.io/voice-library](https://elevenlabs.io/voice-library)
- Preview voices
- Copy the Voice ID

**Via API:**
```bash
curl https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: YOUR_API_KEY"
```

**Popular Voice IDs:**
- `EXAVITQu4vr4xnSDxMaL` - Sarah (default, female, English)
- `21m00Tcm4TlvDq8ikWAM` - Rachel (female, English)
- `AZnzlk1XvdvUeBnXmlld` - Domi (female, English)
- `VR6AewLTigWG4xSOukaG` - Arnold (male, English)

To change voice, update `ELEVENLABS_VOICE_ID` in `.env.local`.

---

## Models

### Available Models

| Model ID | Description | Best For | Latency |
|----------|-------------|----------|---------|
| `eleven_turbo_v2_5` | Fast, high-quality | Real-time applications | ~75ms |
| `eleven_multilingual_v2` | Highest quality | Offline/pre-generation | ~200ms |
| `eleven_monolingual_v1` | English-only | English speech | ~150ms |
| `eleven_flash_v2_5` | Ultra-low latency | Ultra-fast responses | ~50ms |

**Current Selection:** `eleven_turbo_v2_5` (optimal balance for real-time alerts)

---

## Pricing & Limits

### ElevenLabs Free Tier
- **10,000 characters per month**
- All voices and models included
- No credit card required

### Character Count Estimate
- Average AI feedback: ~100-150 characters
- Alerts per month (free tier): ~65-100 alerts
- With 60s cooldown: ~2-3 alerts per hour max

### Upgrade Options
If you exceed free tier:
- **Starter:** $5/month - 30,000 characters
- **Creator:** $22/month - 100,000 characters
- **Pro:** $99/month - 500,000 characters

---

## Error Handling

### Common Errors

#### 401 Unauthorized
**Cause:** Invalid or missing API key

**Solution:**
1. Check `ELEVENLABS_API_KEY` in `.env.local`
2. Verify API key is valid at elevenlabs.io
3. Restart Next.js server after updating `.env.local`

#### 402 Payment Required
**Cause:** Free tier character limit exceeded

**Solution:**
1. Check usage at elevenlabs.io/billing
2. Upgrade plan or wait for monthly reset
3. Temporarily disable voice alerts in config

#### 429 Rate Limited
**Cause:** Too many requests in short time

**Solution:**
- Increase `cooldownSeconds` in app.config.ts
- Default 60s cooldown should prevent this

#### Network Errors
**Cause:** API unreachable or timeout

**Solution:**
- Check internet connection
- Verify ElevenLabs service status
- Review firewall/proxy settings

---

## Performance Considerations

### Latency Optimization

**Total Latency Breakdown:**
1. **AI Feedback Generation:** ~2-3 seconds (Letta AI)
2. **TTS API Request:** ~500ms (eleven_turbo_v2_5)
3. **Audio Transfer:** ~200ms (depends on connection)
4. **Total:** ~3-4 seconds from detection to audio playback

**Optimization Strategies:**
- Using `eleven_turbo_v2_5` for fast synthesis
- Caching audio for repeated phrases (future enhancement)
- Cooldown mechanism prevents request spam

### Resource Management

**Audio Object Cleanup:**
```typescript
audio.onended = () => {
  URL.revokeObjectURL(audioUrl); // Free memory
  isPlayingAudioRef.current = false;
};
```

**Concurrent Playback Prevention:**
```typescript
if (isPlayingAudioRef.current) {
  return; // Skip new request
}
```

---

## Security Best Practices

### API Key Protection

✅ **Do:**
- Store API key in `.env.local` (server-side only)
- Never commit `.env.local` to version control
- Use Next.js API routes as proxy
- Regenerate keys if exposed

❌ **Don't:**
- Expose API key in client-side code
- Hardcode API key in source files
- Share API keys in public repositories

### Request Validation

The API route validates:
- Text input is present
- API key is configured
- Response is successful before returning audio

---

## Monitoring & Debugging

### Console Logs

**Voice Alert Flow:**
```
🎤 Requesting voice alert for: Please adjust your posture...
🔊 Playing voice alert
✅ Voice alert completed
```

**Cooldown Active:**
```
⏳ Skipping voice alert - cooldown active (45s remaining)
```

**Already Playing:**
```
⏭️ Skipping voice alert - audio already playing
```

**Errors:**
```
❌ ElevenLabs API error: 401 Unauthorized
❌ Failed to speak text: Error: Speech API failed: 401
```

### Usage Tracking

Monitor usage at:
- ElevenLabs Dashboard: [elevenlabs.io/app/usage](https://elevenlabs.io/app/usage)
- View character count, API calls, and billing

---

## Testing

### Manual Testing

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Trigger bad posture:**
   - Sit with poor posture in front of camera
   - Wait for posture detection (every 5 seconds)

3. **Verify voice alert:**
   - Check console for "🔊 Playing voice alert"
   - Hear AI feedback spoken aloud

4. **Test cooldown:**
   - Maintain bad posture
   - Verify alerts only occur every 60 seconds

### API Testing

**Direct API Test:**
```bash
curl -X POST http://localhost:3000/api/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"Test voice alert"}' \
  --output test.mp3
```

**Play result:**
```bash
# macOS
afplay test.mp3

# Linux
mpg123 test.mp3

# Windows
start test.mp3
```

---

## Future Enhancements

### Planned Improvements

1. **Voice Customization UI**
   - Allow users to select voice from dropdown
   - Preview voices before selection

2. **Audio Caching**
   - Cache common phrases locally
   - Reduce API calls and latency

3. **Volume Control**
   - Add volume slider in UI
   - Adjust audio element volume

4. **Language Support**
   - Detect user language
   - Use multilingual model for non-English users

5. **Speech Rate Control**
   - Add speed parameter (0.5x - 2x)
   - User preference for faster/slower speech

---

## Troubleshooting Guide

### No Audio Playing

**Check:**
1. Browser console for errors
2. `ELEVENLABS_API_KEY` is set correctly
3. Next.js server was restarted after env changes
4. Browser audio is not muted
5. ElevenLabs account has available credits

### Audio Cuts Off or Overlaps

**Solution:**
- Issue likely resolved by cooldown mechanism
- Verify `isPlayingAudioRef` is working correctly
- Check console logs for "already playing" messages

### Poor Voice Quality

**Solution:**
- Upgrade to `eleven_multilingual_v2` model for better quality
- Try different voice IDs
- Check internet connection speed

---

## References

### Official Documentation
- ElevenLabs API Docs: [elevenlabs.io/docs](https://elevenlabs.io/docs)
- Text-to-Speech API: [elevenlabs.io/docs/api-reference/text-to-speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- Voice Library: [elevenlabs.io/voice-library](https://elevenlabs.io/voice-library)

### Related Files
- API Route: `app/api/speak/route.ts`
- Client Component: `components/PosturePalRoom.tsx`
- Configuration: `config/app.config.ts`
- Environment: `.env.local`

---

## Support

### Getting Help

**ElevenLabs Support:**
- Email: support@elevenlabs.io
- Discord: [discord.gg/elevenlabs](https://discord.gg/elevenlabs)
- Documentation: [elevenlabs.io/docs](https://elevenlabs.io/docs)

**Project Issues:**
- GitHub Issues: [github.com/KarthikSubramanian07/posture-detector/issues](https://github.com/KarthikSubramanian07/posture-detector/issues)

---

## Changelog

### Version 1.0.0 (Current)
- ✅ Initial ElevenLabs integration
- ✅ Voice alert for bad posture
- ✅ 60-second cooldown mechanism
- ✅ Concurrent playback prevention
- ✅ Error handling and logging
- ✅ Configurable via app.config.ts

---

**Last Updated:** October 26, 2025
**Author:** Karthik Subramanian
**Project:** Desk Potato - Posture Detection System
