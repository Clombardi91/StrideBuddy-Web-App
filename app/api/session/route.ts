import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'token is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerClient();

    // 1. Find the invite
    const { data: invite, error: inviteError } = await supabase
      .from('session_invites')
      .select('session_id, expires_at')
      .eq('invite_token', token)
      .limit(1)
      .maybeSingle();

    if (inviteError) {
      console.error('Invite lookup error:', inviteError);

      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      );
    }

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    // 2. Check whether the invite has expired
    if (
      invite.expires_at &&
      new Date(invite.expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: 'Invite link has expired' },
        { status: 410 }
      );
    }

    // 3. Get the session connected to the invite
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        user_id,
        name,
        description,
        activity_type,
        status
      `)
      .eq('id', invite.session_id)
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('Session lookup error:', sessionError);

      return NextResponse.json(
        { error: sessionError.message },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // 4. Get the athlete's display name from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', session.user_id)
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error('Profile lookup error:', profileError);

      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // 5. Return the public data needed by the invite page
    return NextResponse.json({
      id: session.id,
      name: session.name,
      description: session.description,
      activity_type: session.activity_type,
      invite_token: token,
      invite_expires_at: invite.expires_at,
      is_active: session.status !== 'completed',
      athlete_name: profile?.display_name ?? null,
    });
  } catch (err) {
    console.error('Session API error:', err);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}