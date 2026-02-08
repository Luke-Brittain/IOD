import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('import/csv route (dry-run)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('JSON dry-run returns would-create and would-update and validation errors', async () => {
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
      createNode: async () => ({ success: true, data: { id: 'created' } }),
      updateNode: async () => ({ success: true, data: { id: 'exists' } }),
      upsertNode: async (user: any, payload: any) => ({ success: true, data: { id: payload.id ?? 'created' } }),
      findNodeByStableKeys: async (payload: any) => ({ success: true, data: null }),
    }));

    const route = await import('../app/api/import/csv/route');

    const payload = {
      rows: [
        { id: 'exists', name: 'Existing' },
        { name: 'New Item' },
        {}, // validation error (missing name)
      ],
    };

    const req = new Request('http://localhost/api/import/csv?dryRun=true', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await route.POST(req as unknown as Request);
    const body = await (res as Response).json();
    expect(body.success).toBe(true);
    expect(body.data.summary.processed).toBe(3);
    expect(body.data.summary.created).toBe(1);
    expect(body.data.summary.updated).toBe(1);
    expect(body.data.summary.errors).toBe(1);

    const statuses = (body.data.rows as Array<any>).map((r) => r.status);
    expect(statuses).toContain('would-update');
    expect(statuses).toContain('would-create');
    expect(statuses).toContain('error');
  });

  it('multipart CSV dry-run returns would-create and would-update', async () => {
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
      createNode: async () => ({ success: true, data: { id: 'created' } }),
      updateNode: async () => ({ success: true, data: { id: 'exists' } }),
      upsertNode: async (user: any, payload: any) => ({ success: true, data: { id: payload.id ?? 'created' } }),
      findNodeByStableKeys: async (payload: any) => ({ success: true, data: null }),
    }));

    const route = await import('../app/api/import/csv/route');

    const csv = 'id,name\nexists,Existing CSV\n,Created CSV\n';

    // Build FormData with CSV file
    const fd = new FormData();
    const blob = new Blob([csv], { type: 'text/csv' });
    fd.append('file', blob, 'test.csv');

    const req = new Request('http://localhost/api/import/csv?dryRun=true', {
      method: 'POST',
      body: fd,
    });

    const res = await route.POST(req as unknown as Request);
    const body = await (res as Response).json();
    expect(body.success).toBe(true);
    expect(body.data.summary.processed).toBe(2);
    expect(body.data.summary.created).toBe(1);
    expect(body.data.summary.updated).toBe(1);

    const statuses = (body.data.rows as Array<any>).map((r) => r.status);
    expect(statuses).toContain('would-update');
    expect(statuses).toContain('would-create');
  });
});
