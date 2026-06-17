import https from 'node:https';
import { prisma } from '@/lib/prisma';
import { verifyAppSessionToken } from '@/lib/server/app-session';

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

function getBearerToken(authHeader?: string | string[] | null): string | null {
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
}

function fetchSupabaseUser(
  token: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<SupabaseAuthUser | null> {
  const url = new URL(`${supabaseUrl}/auth/v1/user`);

  return new Promise((resolve) => {
    const request = https.request(
      url,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
      },
      (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          if ((response.statusCode ?? 500) >= 400) {
            resolve(null);
            return;
          }

          try {
            const user = JSON.parse(body) as SupabaseAuthUser;
            resolve(user?.email ? user : null);
          } catch {
            resolve(null);
          }
        });
      }
    );

    request.on('error', () => resolve(null));
    request.end();
  });
}

export async function getAuthUserFromAuthHeader(
  authHeader?: string | string[] | null
): Promise<SupabaseAuthUser | null> {
  const token = getBearerToken(authHeader);
  if (!token) return null;

  const appSession = verifyAppSessionToken(token);
  if (appSession) {
    return {
      id: appSession.id,
      email: appSession.email,
      user_metadata: {},
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  return fetchSupabaseUser(token, supabaseUrl, supabaseAnonKey);
}

export async function resolveDbUser(supabaseUser: {
  id: string;
  email?: string | null;
}) {
  if (!supabaseUser.email) return null;

  return prisma.user.findFirst({
    where: {
      OR: [{ id: supabaseUser.id }, { email: supabaseUser.email }],
    },
  });
}
