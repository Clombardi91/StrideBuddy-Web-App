Replace stride-web/app/api/feedback/route.ts with:

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FEEDBACK_TO_EMAIL = process.env.FEEDBACK_TO_EMAIL;
const FEEDBACK_FROM_EMAIL = 'Stride Buddy <feedback@send.stridebuddy.org>';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const message = String(body.message ?? '').trim();
    const userId = body.userId ? String(body.userId) : 'Not provided';

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 },
      );
    }

    if (!process.env.RESEND_API_KEY || !FEEDBACK_TO_EMAIL) {
      return NextResponse.json(
        { error: 'Feedback email is not configured.' },
        { status: 500 },
      );
    }

    const { error } = await resend.emails.send({
      from: FEEDBACK_FROM_EMAIL,
      to: FEEDBACK_TO_EMAIL,
      replyTo: email,
      subject: `Stride Buddy Feedback from ${name}`,
      text: `
New Stride Buddy feedback

Name:
${name}

Email:
${email}

User ID:
${userId}

Message:
${message}
      `.trim(),
    });

    if (error) {
      console.error('Resend feedback error:', error);

      return NextResponse.json(
        { error: 'Failed to send feedback.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);

    return NextResponse.json(
      { error: 'Failed to submit feedback.' },
      { status: 500 },
    );
  }
}