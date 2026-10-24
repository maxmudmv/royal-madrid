import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminCredentials,
} from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = (body.username || '').trim();
    const password = body.password || '';

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken(username);
    const db = await getDb();

    await db.query(
      `INSERT INTO admin_audit_log (actor, action, entity_table, entity_id, reason)
       VALUES ($1, 'ADMIN_LOGIN', 'admin_session', $1, 'Authenticated administrator login via server-side HMAC session');`,
      [username]
    );

    const response = NextResponse.json({
      authenticated: true,
      username,
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Authentication error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
