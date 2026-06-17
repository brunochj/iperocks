import crypto from 'node:crypto';

const APP_SESSION_PREFIX = 'app.';

type AppSessionPayload = {
  sub: string;
  email: string;
  exp: number;
};

export function createAppSessionToken(user: { id: string; email: string }) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured.');
  }

  const payload: AppSessionPayload = {
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${APP_SESSION_PREFIX}${payloadB64}.${signature}`;
}

export function verifyAppSessionToken(token: string) {
  if (!token.startsWith(APP_SESSION_PREFIX)) return null;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const rest = token.slice(APP_SESSION_PREFIX.length);
  const dotIndex = rest.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const payloadB64 = rest.slice(0, dotIndex);
  const signature = rest.slice(dotIndex + 1);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as AppSessionPayload;

    if (!payload.sub || !payload.email || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
