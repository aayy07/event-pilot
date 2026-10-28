import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRegistrationToken, isAdminSession, sessionCookie, type EventDetails } from '../../../../lib/security';

export async function POST(request: Request) {
  if (!isAdminSession(cookies().get(sessionCookie)?.value)) {
    return NextResponse.json({ error: 'Admin sign-in required.' }, { status: 401 });
  }

  let event: EventDetails;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: 'Event details are required.' }, { status: 400 });
  }

  const fields = [event.id, event.name, event.date, event.startTime, event.venue, event.description];
  if (!fields.every((field) => typeof field === 'string') || !event.id || !event.name || !event.date || !event.venue) {
    return NextResponse.json({ error: 'Complete the event name, date, and venue.' }, { status: 400 });
  }

  try {
    const token = createRegistrationToken(event);
    return NextResponse.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Event link signing is not configured.' }, { status: 503 });
  }
}