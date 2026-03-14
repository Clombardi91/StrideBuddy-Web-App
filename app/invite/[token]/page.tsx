import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase-server';
import { ACTIVITY_LABELS } from '@/lib/types';
import { InviteLanding } from '@/components/InviteLanding';

interface Props {
  params: { token: string };
}

async function getInviteByToken(token: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('session_invites')
    .select(`
      invite_token,
      expires_at,
      session_id,
      sessions (
        id,
        name,
        description,
        activity_type,
        is_active
      )
    `)
    .eq('invite_token', token)
    .single();

  if (error || !data) {
    return null;
  }

  const session = Array.isArray(data.sessions) ? data.sessions[0] : data.sessions;

  if (!session) {
    return null;
  }

  return {
    invite_token: data.invite_token,
    expires_at: data.expires_at,
    session,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const invite = await getInviteByToken(params.token);

  if (!invite) {
    return { title: 'Stride Buddy Invite' };
  }

  const session = invite.session;
  const activity =
    ACTIVITY_LABELS[session.activity_type as keyof typeof ACTIVITY_LABELS];

  return {
    title: `Cheer on ${session.name}! — Stride Buddy`,
    description:
      session.description ??
      `Your runner is training hard. Record a voice message and it'll play during their ${activity?.noun ?? 'workout'} to keep them going!`,
    openGraph: {
      title: `Someone wants your voice for their ${activity?.noun ?? 'run'}! 🎙️`,
      description:
        session.description ??
        `Record a quick message for ${session.name} and keep them going!`,
    },
  };
}

export default async function InvitePage({ params }: Props) {
  const invite = await getInviteByToken(params.token);

  if (!invite) {
    notFound();
  }

  const { session, expires_at } = invite;

  if (!session.is_active) {
    return <ExpiredPage reason="Session has ended" />;
  }

  if (expires_at && new Date(expires_at) < new Date()) {
    return <ExpiredPage reason="Invite link has expired" />;
  }

  return <InviteLanding session={session} inviteToken={params.token} />;
}

function ExpiredPage({ reason }: { reason: string }) {
  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient flex items-center justify-center px-6">
      <div className="page-enter text-center max-w-xs">
        <div className="text-6xl mb-5">⏰</div>
        <h1 className="font-display text-4xl text-ink-900 mb-3">
          Link Unavailable
        </h1>
        <p className="text-ink-500 text-sm leading-relaxed">
          {reason}. Ask your runner for an updated invite link!
        </p>
      </div>
    </main>
  );
}