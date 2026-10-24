import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'rm_admin_session';

function getSigningSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    '9f4a8c2e7b1d6f3a5c8e0b2d4f6a8c1e3b5d7f9a2c4e6b8d0f1a3c5e7b9d2f4a'
  );
}

export function createAdminSessionToken(username: string): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 12 * 60 * 60 * 1000; // 12 hours
  const payload = Buffer.from(
    JSON.stringify({ sub: username, role: 'admin', iat: issuedAt, exp: expiresAt })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined): {
  valid: boolean;
  username?: string;
} {
  if (!token || !token.includes('.')) return { valid: false };
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return { valid: false };

  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return { valid: false };
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8')
    ) as { sub: string; role: string; exp: number };
    if (decoded.role !== 'admin' || Date.now() > decoded.exp) {
      return { valid: false };
    }
    return { valid: true, username: decoded.sub };
  } catch {
    return { valid: false };
  }
}

export function verifyAdminCredentials(
  usernameInput: string,
  passwordInput: string
): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'RoyalMadridAdmin!2026';

  const uA = Buffer.from(usernameInput);
  const uB = Buffer.from(expectedUser);
  const pA = Buffer.from(passwordInput);
  const pB = Buffer.from(expectedPass);

  const userMatch = uA.length === uB.length && crypto.timingSafeEqual(uA, uB);
  const passMatch = pA.length === pB.length && crypto.timingSafeEqual(pA, pB);
  return userMatch && passMatch;
}

export async function getAuthenticatedAdmin(): Promise<{
  authenticated: boolean;
  username?: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const verified = verifyAdminSessionToken(token);
  return {
    authenticated: verified.valid,
    username: verified.username,
  };
}
