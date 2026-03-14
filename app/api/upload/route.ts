import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '@/lib/supabase-server';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const MIME_TO_EXTENSION: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/webm': '.webm',
  'audio/webm;codecs=opus': '.webm',
  'audio/ogg': '.ogg',
  'audio/ogg;codecs=opus': '.ogg',
  'audio/wav': '.wav',
  'audio/mp4': '.m4a',
};

function getExtension(mimeType: string): string {
  const base = mimeType.split(';')[0].trim();
  return MIME_TO_EXTENSION[mimeType] ?? MIME_TO_EXTENSION[base] ?? '.audio';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createAdminClient();
    const contentType = request.headers.get('content-type') ?? '';

    let audioBuffer: Buffer;
    let mimeType = 'audio/webm';
    let sessionId = '';
    let supporterName = '';
    let sourceType: 'recorded' | 'tts' = 'recorded';
    let textContent: string | undefined;
    let durationSeconds: number | undefined;
    let token = '';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('audio') as File | null;

      if (!file) {
        return NextResponse.json(
          { message: 'No audio file in request' },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { message: 'File exceeds 10 MB limit' },
          { status: 413 },
        );
      }

      audioBuffer = Buffer.from(await file.arrayBuffer());
      mimeType = file.type || 'audio/webm';
      sessionId = (form.get('sessionId') as string) ?? '';
      supporterName = (form.get('supporterName') as string) ?? 'Anonymous';
      sourceType = 'recorded';
      token = (form.get('token') as string) ?? '';

      const rawDur = form.get('duration');
      durationSeconds = rawDur ? parseInt(rawDur as string, 10) : undefined;
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      const {
        audioBase64,
        mimeType: mt,
        sessionId: sid,
        supporterName: sn,
        textContent: tc,
        sourceType: st,
        token: tk,
      } = body;

      if (!audioBase64) {
        return NextResponse.json(
          { message: 'audioBase64 is required' },
          { status: 400 },
        );
      }

      audioBuffer = Buffer.from(audioBase64, 'base64');

      if (audioBuffer.length > MAX_FILE_BYTES) {
        return NextResponse.json(
          { message: 'Audio exceeds 10 MB limit' },
          { status: 413 },
        );
      }

      mimeType = mt ?? 'audio/mpeg';
      sessionId = sid ?? '';
      supporterName = sn ?? 'Anonymous';
      sourceType = st === 'recorded' ? 'recorded' : 'tts';
      textContent = tc;
      token = tk ?? '';
    } else {
      return NextResponse.json(
        { message: 'Unsupported content type' },
        { status: 415 },
      );
    }

    if (!supporterName.trim()) {
      return NextResponse.json(
        { message: 'supporterName is required' },
        { status: 400 },
      );
    }

    if (!token.trim()) {
      return NextResponse.json(
        { message: 'token is required' },
        { status: 400 },
      );
    }

    const { data: invite, error: inviteErr } = await supabase
      .from('session_invites')
      .select(`
        session_id,
        expires_at,
        sessions (
          id,
          is_active
        )
      `)
      .eq('invite_token', token.trim())
      .single();

    if (inviteErr || !invite) {
      console.error('[Upload API] Invite lookup error:', inviteErr);
      return NextResponse.json(
        { message: 'Invite not found' },
        { status: 404 },
      );
    }

    const session = Array.isArray(invite.sessions)
      ? invite.sessions[0]
      : invite.sessions;

    if (!session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 },
      );
    }

    if (!session.is_active) {
      return NextResponse.json(
        { message: 'This session is no longer accepting messages' },
        { status: 410 },
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { message: 'This invite link has expired' },
        { status: 410 },
      );
    }

    sessionId = invite.session_id;

    const messageId = uuidv4();
    const ext = getExtension(mimeType);
    const storagePath = `${sessionId}/${messageId}${ext}`;

    const { error: storageErr } = await supabase.storage
      .from('messages')
      .upload(storagePath, audioBuffer, {
        contentType: mimeType,
        cacheControl: '31536000',
        upsert: false,
      });

    if (storageErr) {
      console.error('[Upload API] Storage upload error:', storageErr);
      return NextResponse.json(
        {
          message: 'Failed to store audio file',
          detail: storageErr.message,
        },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from('messages')
      .getPublicUrl(storagePath);

    const { data: message, error: dbErr } = await supabase
      .from('messages')
      .insert({
        id: messageId,
        session_id: sessionId,
        sender_name: supporterName.trim().slice(0, 80),
        message_type: sourceType,
        text_content: textContent?.trim() ?? null,
        audio_url: urlData.publicUrl,
        duration_seconds: durationSeconds ?? null,
        approved: true,
      })
      .select('id, sender_name, message_type, audio_url')
      .single();

    if (dbErr) {
      await supabase.storage.from('messages').remove([storagePath]);
      console.error('[Upload API] DB insert error:', dbErr);
      return NextResponse.json(
        { message: 'Failed to save message' },
        { status: 500 },
      );
    }

    supabase
      .rpc('increment_session_messages', { session_id_input: sessionId })
      .then(
        () => {},
        (e) =>
          console.warn(
            '[Upload API] increment_session_messages failed:',
            e,
          ),
      );

    return NextResponse.json(
      {
        messageId: message.id,
        audioUrl: message.audio_url,
        supporterName: message.sender_name,
        sourceType: message.message_type,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[Upload API] Unexpected error:', err);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}