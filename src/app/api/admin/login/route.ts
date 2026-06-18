import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'admin_auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'adminjax';

    if (username === adminUser && password === adminPass) {
      const response = NextResponse.json({ success: true });
      response.cookies.set(AUTH_COOKIE, '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    } else {
      return NextResponse.json(
        { error: 'Username atau Password salah' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const isAuthenticated = request.cookies.get(AUTH_COOKIE)?.value === '1';
  return NextResponse.json({ authenticated: isAuthenticated });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
