import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.FISH_AUDIO_API_KEY;
    if (!apiKey) {
      console.error('❌ FISH_AUDIO_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('🎤 Requesting TTS from Fish Audio for text:', text.substring(0, 50) + '...');

    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        format: 'mp3',
        model: 's1',
        prosody: {
          speed: 1,
          volume: 0
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Fish Audio API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Fish Audio API failed: ${response.status}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('✅ TTS audio generated, size:', audioBuffer.byteLength, 'bytes');

    return new NextResponse(Buffer.from(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error: any) {
    console.error('❌ Failed to generate speech:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech', details: error.message },
      { status: 500 }
    );
  }
}
