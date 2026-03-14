import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_URL = 'https://api.openai.com/v1/audio/speech';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = (body.text ?? '').toString().trim();
    const voice = (body.voice ?? 'marin').toString();
    const speed =
      typeof body.speed === 'number' && body.speed > 0 ? body.speed : 1.0;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY on server' },
        { status: 500 },
      );
    }

    const openaiRes = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice,
        input: text,
        format: 'mp3',
        speed,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('[TTS API] OpenAI error:', errText);

      return NextResponse.json(
        { error: 'Failed to generate TTS audio' },
        { status: 500 },
      );
    }

    const audioBuffer = Buffer.from(await openaiRes.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    return NextResponse.json({
      audioBase64,
      mimeType: 'audio/mpeg',
      estimatedDurationSeconds: Math.max(1, Math.ceil(text.length / 14)),
    });
  } catch (error) {
    console.error('[TTS API] Unexpected error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}