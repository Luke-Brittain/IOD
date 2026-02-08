import { describe, it, expect, vi } from 'vitest';

// Mock the auth helpers so tests don't call external supabase client
vi.mock('../lib/auth', () => {
  return {
    requireAuth: async (req: Request) => {
      // read our test header set by makeReq
      const anyReq = req as unknown as { headers: Map<string, string> };
      const raw = anyReq.headers.get('x-user');
      return JSON.parse(raw ?? 'null');
    },
    hasPermission: (user: unknown, permission: string) => {
      if (typeof user !== 'object' || user === null) return false;
      const u = user as Record<string, unknown>;
      const userMeta = u.user_metadata as Record<string, unknown> | undefined;
      const role = userMeta && (userMeta.role as string | undefined);
      if (role === 'admin') return true;
      if (role === 'editor') return ['nodes:create', 'nodes:update', 'nodes:read'].includes(permission);
      if (role === 'viewer') return permission === 'nodes:read';
      return false;
    },
  };
});

import { requirePermission, requireAnyPermission } from '../lib/authMiddleware';

// Minimal mock Request-like object used by our middleware helpers
function makeReq(user: unknown) {
  return { headers: new Map([['x-user', JSON.stringify(user)]]) } as unknown as Request;
}

describe('authMiddleware', () => {
  it('requirePermission throws for missing permission', async () => {
    const req = makeReq({ id: 'v1', user_metadata: { role: 'viewer' } });
    await expect(requirePermission(req as unknown as Request, 'nodes:create')).rejects.toEqual({ status: 403, message: 'Insufficient permission' });
  });

  it('requireAnyPermission allows if one matches', async () => {
    const req = makeReq({ id: 'e1', user_metadata: { role: 'editor' } });
    await expect(requireAnyPermission(req as unknown as Request, ['nodes:read', 'edges:add'])).resolves.toBeDefined();
  });
});
