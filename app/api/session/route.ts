import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('sessions')
      .select('id, name, description, activity_type, invite_token, invite_expires_at, is_active')
      .eq('invite_token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!data.is_active) {
      return NextResponse.json({ error: 'Session is no longer active' }, { status: 410 });
    }

    if (data.invite_expires_at && new Date(data.invite_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite link has expired' }, { status: 410 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
