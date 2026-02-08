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
    // @ts-ignore
    const result = await supabase.auth.getUser(token);
    const user = result?.data?.user ?? result?.user ?? null;

    if (!user) {
      throw { status: 401, message: 'Invalid or expired token' };
    }

    return user;
  } catch (err: any) {
    throw { status: 401, message: err?.message ?? 'Authentication failed' };
  }
}

export function hasRole(user: any, allowedRoles: string[]) {
  const role = user?.user_metadata?.role || user?.app_metadata?.role || user?.role;
  if (!role) return false;
  return allowedRoles.includes(role);
}
