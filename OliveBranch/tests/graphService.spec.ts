import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('graphService (permission flows)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('addEdge: forbids non-admin/steward without ownership', async () => {
    // Mock nodeService.getNodeById to return two nodes not owned by user
    vi.doMock('../services/nodeService', () => ({
      getNodeById: async (id: string) => ({ success: true, data: { id, ownerId: 'ownerX', stewards: [] } }),
    }));

    // Mock graph client (should not be called for forbidden case, but provide stub)
    vi.doMock('../lib/graph/client', () => ({ getSession: () => ({ run: async () => ({ records: [] }), close: async () => {} }) }));

    const { addEdge } = await import('../services/graphService');
    const user = { id: 'u1', user_metadata: { role: 'viewer' } } as Record<string, unknown>;
    const res = await addEdge(user, 'from1', 'to1', 'REL');
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('FORBIDDEN');
  });

  it('addEdge: allows steward and creates relationship', async () => {
    vi.doMock('../services/nodeService', () => ({
      getNodeById: async (id: string) => ({ success: true, data: { id, ownerId: 'ownerX', stewards: [] } }),
    }));

    // Mock graph client to return a created relation
    vi.doMock('../lib/graph/client', () => ({
      getSession: () => ({
        run: async () => ({ records: [{ get: (_k: string) => ({ id: 'r1', type: 'REL' }) }] }),
        close: async () => {},
      }),
    }));

    const { addEdge } = await import('../services/graphService');
    const user = { id: 's1', user_metadata: { role: 'steward' } } as Record<string, unknown>;
    const res = await addEdge(user, 'from1', 'to1', 'REL');
    expect(res.success).toBe(true);
    expect(res.data?.rel).toBeDefined();
  });
});
