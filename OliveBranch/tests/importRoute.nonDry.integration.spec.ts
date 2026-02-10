// Use `unknown` for mock args to avoid explicit `any` and unused-vars
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('import/csv route (non-dry-run integration)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('JSON non-dry-run performs create and update calls', async () => {
    const createMock = vi.fn(async (_user: unknown, _payload: unknown) => ({ success: true, data: { id: 'created' } }));
    const updateMock = vi.fn(async (_user: unknown, id: string, _payload: unknown) => ({ success: true, data: { id } }));
    const upsertMock = vi.fn(async (user: unknown, payload: unknown) => {
      const id = (payload as Record<string, unknown>)['id'] as string | undefined;
      if (id) return updateMock(user, id, payload);
      return createMock(user, payload);
    });

    vi.doMock('next/server', () => ({
      NextResponse: { json: (body: unknown, init?: unknown) => new Response(JSON.stringify(body), init as unknown as ResponseInit) },
    }));

    vi.doMock('@/lib/validation/schemas', () => ({
      ImportRowsSchema: { safeParse: (b: unknown) => ({ success: !!b && Array.isArray((b as Record<string, unknown>).rows), data: b }) },
      NodeCreateSchema: { safeParse: (p: unknown) => ({ success: typeof (p as Record<string, unknown>)?.name === 'string' && (p as Record<string, unknown>).name.length > 0, data: p, error: { flatten: () => ({ formErrors: ['name required'] }) } }) },
    }));

    vi.doMock('@/lib/authMiddleware', () => ({
      requirePermission: async () => ({ id: 'tester', user_metadata: { role: 'admin' } }),
    }));

    vi.doMock('@/services/nodeService', () => ({
      getNodeById: async (id: string) => ({ success: id === 'exists', data: id === 'exists' ? { id: 'exists' } : null }),
      createNode: createMock,
      updateNode: updateMock,
      upsertNode: upsertMock,
    }));

    const route = await import('../app/api/import/csv/route');

    const payload = {
      rows: [
        { id: 'exists', name: 'Existing' },
        { name: 'New Item' },
      ],
    };

    const req = new Request('http://localhost/api/import/csv', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await route.POST(req as unknown as Request);
    const body = await (res as Response).json();
    expect(body.success).toBe(true);
    expect(body.data.summary.processed).toBe(2);
    expect(body.data.summary.created).toBe(1);
    expect(body.data.summary.updated).toBe(1);
    expect(upsertMock).toHaveBeenCalledTimes(2);
  });
});
