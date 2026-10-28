import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminSession, isAdminCredentials, isAdminSession, sessionCookie } from '../../../../lib/security';

export async function GET() {
  const session = cookies().get(sessionCookie)?.value;
  if (!isAdminSession(session)) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, email: process.env.ADMIN_EMAIL });
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Enter your admin email and password.' }, { status: 400 });
  }

  if (!body.email || !body.password || !isAdminCredentials(body.email, body.password)) {
    return NextResponse.json({ error: 'The email or password is incorrect.' }, { status: 401 });
  }

  try {
    const response = NextResponse.json({ authenticated: true, email: process.env.ADMIN_EMAIL });
    response.cookies.set(sessionCookie, createAdminSession(process.env.ADMIN_EMAIL ?? body.email), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 503 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(sessionCookie, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}