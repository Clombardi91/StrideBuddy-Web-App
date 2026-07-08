import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase-server';
import { ACTIVITY_LABELS } from '@/lib/types';
import { InviteLanding } from '@/components/InviteLanding';
import type { SessionPublic } from '@/lib/types';

interface Props {
  params: { token: string };
}

async function getInviteByToken(token: string): Promise<SessionPublic | null> {
  const supabase = createServerClient();

  const { data: invite, error: inviteError } = await supabase
    .from('session_invites')
    .select('session_id, expires_at')
    .eq('invite_token', token)
    .limit(1)
    .maybeSingle();

  if (inviteError || !invite) return null;

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return null;
  }

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

  if (sessionError || !session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', session.user_id)
    .limit(1)
    .maybeSingle();

  return {
    id: session.id,
    name: session.name,
    description: session.description,
    activity_type: session.activity_type,
    invite_token: token,
    invite_expires_at: invite.expires_at,
    is_active: session.status !== 'completed',
    athlete_name: profile?.display_name ?? null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await getInviteByToken(params.token);

  if (!session) {
    return { title: 'Stride Buddy Invite' };
  }

  const athleteName = session.athlete_name || 'your athlete';
  const activity =
    ACTIVITY_LABELS[session.activity_type as keyof typeof ACTIVITY_LABELS];

  return {
    title: `Support ${athleteName} — Stride Buddy`,
    description:
      session.description ??
      `Leave a voice message or typed note. They’ll hear it during their ${
        activity?.noun ?? 'workout'
      } when they need the extra push.`,
    openGraph: {
      title: `Support ${athleteName} on Stride Buddy`,
      description:
        session.description ??
        `Send encouragement they’ll hear during their ${
          activity?.noun ?? 'workout'
        }.`,
    },
  };
}

export default async function InvitePage({ params }: Props) {
  const session = await getInviteByToken(params.token);

  if (!session) {
    notFound();
  }

  if (!session.is_active) {
    return <ExpiredPage reason="Session has ended" />;
  }

  return <InviteLanding session={session} inviteToken={params.token} />;
}

function ExpiredPage({ reason }: { reason: string }) {
  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient flex items-center justify-center px-6">
      <div className="page-enter text-center max-w-xs">
        <h1 className="font-display text-4xl text-ink-900 mb-3">
          Link Unavailable
        </h1>
        <p className="text-ink-500 text-sm leading-relaxed">
          {reason}. Ask your athlete for an updated invite link.
        </p>
      </div>
    </main>
  );
}