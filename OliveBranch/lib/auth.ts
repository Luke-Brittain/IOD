/**
 * lib/auth.ts
 * Server-side authentication and simple RBAC helpers using Supabase.
 */

import { getSupabaseServer } from '@/lib/supabase/client';

export async function requireAuth(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth) throw { status: 401, message: 'Unauthorized' };
  const token = auth.replace('Bearer ', '').trim();

  const supabase = getSupabaseServer();

  try {
    // supabase.auth.getUser accepts either an access token or object depending on SDK version.
    // Try common call patterns; adapt if your supabase client differs.
    // @ts-expect-error - supabase SDK may expose getUser differently across versions
    const result = await supabase.auth.getUser(token);
    const user = result?.data?.user ?? result?.user ?? null;

    if (!user) {
      throw { status: 401, message: 'Invalid or expired token' };
    }

    return user;
  } catch (err: unknown) {
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Authentication failed';
    throw { status: 401, message };
  }
}

export function hasRole(user: unknown, allowedRoles: string[]) {
  if (typeof user !== 'object' || user === null) return false;
  const u = user as Record<string, unknown>;
  const userMeta = u.user_metadata as Record<string, unknown> | undefined;
  const appMeta = u.app_metadata as Record<string, unknown> | undefined;
  const role = (userMeta && (userMeta.role as string | undefined)) || (appMeta && (appMeta.role as string | undefined)) || (u.role as string | undefined);
  if (!role) return false;
  return allowedRoles.includes(role);
}
