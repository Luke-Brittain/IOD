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
    const createMock = vi.fn(async (user: any, payload: any) => ({ success: true, data: { id: 'created' } }));
    const updateMock = vi.fn(async (user: any, id: string, payload: any) => ({ success: true, data: { id } }));

    vi.doMock('next/server', () => ({
      NextResponse: { json: (body: unknown, init?: unknown) => new Response(JSON.stringify(body), init as any) },
    }));

    vi.doMock('@/lib/validation/schemas', () => ({
      ImportRowsSchema: { safeParse: (b: any) => ({ success: !!b && Array.isArray(b.rows), data: b }) },
      NodeCreateSchema: { safeParse: (p: any) => ({ success: typeof p?.name === 'string' && p.name.length > 0, data: p, error: { flatten: () => ({ formErrors: ['name required'] }) } }) },
    }));

    vi.doMock('@/lib/authMiddleware', () => ({
      requirePermission: async () => ({ id: 'tester', user_metadata: { role: 'admin' } }),
    }));

    vi.doMock('@/services/nodeService', () => ({
      getNodeById: async (id: string) => ({ success: id === 'exists', data: id === 'exists' ? { id: 'exists' } : null }),
      createNode: createMock,
      updateNode: updateMock,
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
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(1);
  });
});
