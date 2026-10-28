import { NextResponse } from 'next/server';
import { readRegistrationToken } from '../../../../lib/security';

type RouteContext = { params: { token: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const event = readRegistrationToken(params.token);
    if (!event) return NextResponse.json({ error: 'This registration link is invalid.' }, { status: 404 });
    return NextResponse.json({ valid: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Registration is temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  let body: { name?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Enter your name and work email.' }, { status: 400 });
  }

  const name = body.name?.trim() ?? '';
  const email = body.email?.trim().toLowerCase() ?? '';
  if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid name and email address.' }, { status: 400 });
  }
  if (!email.endsWith('@sc.com')) {
    return NextResponse.json({ error: 'Registration is limited to @sc.com email addresses.' }, { status: 403 });
  }

  try {
    const event = readRegistrationToken(params.token);
    if (!event) return NextResponse.json({ error: 'This registration link is invalid.' }, { status: 404 });
    return NextResponse.json({ registered: true, event });
  } catch {
    return NextResponse.json({ error: 'Registration is temporarily unavailable.' }, { status: 503 });
  }
}