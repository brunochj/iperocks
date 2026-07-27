import https from 'node:https';

type JsonRecord = Record<string, unknown>;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, anonKey, serviceRoleKey };
}

function requestJson<T>(
  path: string,
  options: {
    method?: string;
    body?: JsonRecord;
    apiKey: string;
  }
): Promise<{ status: number; data: T | null }> {
  const { url } = getSupabaseConfig();
  if (!url) return Promise.resolve({ status: 500, data: null });

  const target = new URL(path, url);
  const payload = options.body ? JSON.stringify(options.body) : undefined;

  return new Promise((resolve) => {
    const req = https.request(
      target,
      {
        method: options.method ?? 'GET',
        headers: {
          apikey: options.apiKey,
          Authorization: `Bearer ${options.apiKey}`,
          ...(payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
              }
            : {}),
        },
      },
      (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          if (!body) {
            resolve({ status: response.statusCode ?? 500, data: null });
            return;
          }

          try {
            resolve({
              status: response.statusCode ?? 500,
              data: JSON.parse(body) as T,
            });
          } catch {
            resolve({ status: response.statusCode ?? 500, data: null });
          }
        });
      }
    );

    req.on('error', () => resolve({ status: 500, data: null }));
    if (payload) req.write(payload);
    req.end();
  });
}

type AdminUsersResponse = {
  users?: Array<{ id: string; email?: string | null }>;
};

type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: JsonRecord;
};

export async function findSupabaseUserByEmail(email: string) {
  const { serviceRoleKey } = getSupabaseConfig();
  if (!serviceRoleKey) return null;

  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (page <= 10) {
    const { status, data } = await requestJson<AdminUsersResponse>(
      `/auth/v1/admin/users?page=${page}&per_page=200`,
      { apiKey: serviceRoleKey }
    );

    if (status >= 400 || !data?.users?.length) break;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );
    if (match) return match;

    if (data.users.length < 200) break;
    page += 1;
  }

  return null;
}

export async function ensureSupabasePasswordUser(
  email: string,
  password: string,
  metadata?: { name?: string | null; username?: string | null }
) {
  const { serviceRoleKey } = getSupabaseConfig();
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const payload = {
    email,
    password,
    email_confirm: true,
    user_metadata: {
      ...(metadata?.name ? { name: metadata.name } : {}),
      ...(metadata?.username ? { username: metadata.username } : {}),
    },
  };

  const existing = await findSupabaseUserByEmail(email);
  if (existing) {
    await requestJson(`/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      apiKey: serviceRoleKey,
      body: payload,
    });
    return existing.id;
  }

  const { status, data } = await requestJson<{ id?: string }>(
    '/auth/v1/admin/users',
    {
      method: 'POST',
      apiKey: serviceRoleKey,
      body: payload,
    }
  );

  if (status >= 400 || !data?.id) {
    throw new Error('Could not sync Supabase auth user.');
  }

  return data.id;
}

export async function createConfirmedSupabaseUser(
  email: string,
  password: string,
  metadata?: { name?: string | null; username?: string | null }
) {
  return ensureSupabasePasswordUser(email, password, metadata);
}

export async function signInWithPassword(email: string, password: string) {
  const { anonKey } = getSupabaseConfig();
  if (!anonKey) return null;

  const { status, data } = await requestJson<AuthSession>(
    '/auth/v1/token?grant_type=password',
    {
      method: 'POST',
      apiKey: anonKey,
      body: { email, password },
    }
  );

  if (status >= 400 || !data?.access_token) return null;
  return data;
}

type AdminUser = {
  id: string;
  identities?: Array<{ provider: string }>;
};

export async function getSupabaseAdminUser(userId: string): Promise<AdminUser | null> {
  const { serviceRoleKey } = getSupabaseConfig();
  if (!serviceRoleKey) return null;

  const { status, data } = await requestJson<AdminUser>(
    `/auth/v1/admin/users/${userId}`,
    { apiKey: serviceRoleKey }
  );

  if (status >= 400 || !data?.id) return null;
  return data;
}

export function hasServiceRoleKey() {
  return Boolean(getSupabaseConfig().serviceRoleKey);
}

export async function updateSupabaseUserPassword(userId: string, newPassword: string): Promise<boolean> {
  const { serviceRoleKey } = getSupabaseConfig();
  if (!serviceRoleKey) return false;

  const { status } = await requestJson(`/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    apiKey: serviceRoleKey,
    body: { password: newPassword },
  });

  return status >= 200 && status < 300;
}
