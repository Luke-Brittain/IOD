import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('nodeService (permission flows)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('createNode: rejects viewer role', async () => {
    vi.doMock('../lib/supabase/client', () => ({
      getSupabaseServer: () => ({
        from: () => ({
          insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        }),
      }),
    }));

    const { createNode } = await import('../services/nodeService');
    const user = { id: 'u1', user_metadata: { role: 'viewer' } } as Record<string, unknown>;
    const res = await createNode(user, { name: 'Test' } as Partial<Record<string, unknown>>);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('FORBIDDEN');
  });

  it('createNode: allows editor and returns data', async () => {
    vi.doMock('../lib/supabase/client', () => ({
      getSupabaseServer: () => ({
        from: () => ({
          insert: (node: Record<string, unknown>) => ({ select: () => ({ single: async () => ({ data: { id: 'n1', ...node }, error: null }) }) }),
        }),
      }),
    }));

    const { createNode } = await import('../services/nodeService');
    const user = { id: 'u2', user_metadata: { role: 'editor' } } as Record<string, unknown>;
    const res = await createNode(user, { name: 'Created' } as Partial<Record<string, unknown>>);
    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('n1');
  });

  it('updateNode: forbids when not owner/steward and insufficient role', async () => {
    const testNode = { id: 'n2', ownerId: 'someone', stewards: [] };

    vi.doMock('../lib/supabase/client', () => ({
      getSupabaseServer: () => ({
        from: () => ({
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: testNode, error: null }) }) }),
          update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: { id: 'n2' }, error: null } ) }) }) }),
        }),
      }),
    }));

    const { updateNode } = await import('../services/nodeService');
    const user = { id: 'uX', user_metadata: { role: 'viewer' } } as Record<string, unknown>;

    const res = await updateNode(user, 'n2', { name: 'x' });
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('FORBIDDEN');
  });

  it('updateNode: allows owner to update', async () => {
    const testNode = { id: 'n3', ownerId: 'own1', stewards: [] };

    vi.doMock('../lib/supabase/client', () => ({
      getSupabaseServer: () => ({
        from: () => ({
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: testNode, error: null }) }) }),
          update: (cleaned: Record<string, unknown>) => ({ eq: () => ({ select: () => ({ single: async () => ({ data: { id: 'n3', ...cleaned }, error: null } ) }) }) }),
        }),
      }),
    }));

    const { updateNode } = await import('../services/nodeService');
    const user = { id: 'own1', user_metadata: { role: 'viewer' } } as Record<string, unknown>; // owner should be allowed

    const res = await updateNode(user, 'n3', { description: 'updated' });
    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('n3');
    expect(res.data?.description).toBe('updated');
  });
});
