import { requireAuth, hasPermission } from './auth';

/**
 * requirePermission - helper to require an authenticated user with a permission
 * Throws an object { status, message } on failure so route handlers can catch it.
 */
export async function requirePermission(req: Request, permission: string) {
  const user = await requireAuth(req);
  if (!hasPermission(user, permission)) {
    throw { status: 403, message: 'Insufficient permission' };
  }
  return user;
}

/**
 * requireAnyPermission - require at least one of the provided permissions
 */
export async function requireAnyPermission(req: Request, permissions: string[]) {
  const user = await requireAuth(req);
  for (const p of permissions) {
    if (hasPermission(user, p)) return user;
  }
  throw { status: 403, message: 'Insufficient permission' };
}

export function unauthorizedResponse(status = 403, message = 'Insufficient permission') {
  return { status, body: { success: false, error: { code: 'FORBIDDEN', message } } };
}
