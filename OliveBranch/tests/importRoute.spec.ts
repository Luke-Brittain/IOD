// Test uses unknown-typed mocks to avoid explicit `any` and unused-var rules
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
      createNode: async () => ({ success: true, data: { id: 'created' } }),
      updateNode: async () => ({ success: true, data: { id: 'exists' } }),
      upsertNode: async (user: unknown, payload: unknown) => ({ success: true, data: { id: ((payload as Record<string, unknown>)['id'] as string) ?? 'created' } }),
      findNodeByStableKeys: async (_payload: unknown) => ({ success: true, data: null }),
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

    const statuses = (body.data.rows as Array<Record<string, unknown>>).map((r) => String(r['status']));
    expect(statuses).toContain('would-update');
    expect(statuses).toContain('would-create');
    expect(statuses).toContain('error');
  });

  it('multipart CSV dry-run returns would-create and would-update', async () => {
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
      createNode: async () => ({ success: true, data: { id: 'created' } }),
      updateNode: async () => ({ success: true, data: { id: 'exists' } }),
      upsertNode: async (user: unknown, payload: unknown) => ({ success: true, data: { id: ((payload as Record<string, unknown>)['id'] as string) ?? 'created' } }),
      findNodeByStableKeys: async (_payload: unknown) => ({ success: true, data: null }),
    }));

    const route = await import('../app/api/import/csv/route');

    const csv = 'id,name\nexists,Existing CSV\n,Created CSV\n';

    // Build FormData with CSV file
    // Create a lightweight request-like object where formData() returns a file-like object
    const req = {
      method: 'POST',
      url: 'http://localhost/api/import/csv?dryRun=true',
      headers: new Headers({ 'content-type': 'multipart/form-data' }),
      formData: async () => ({ get: (_: string) => ({ text: async () => csv, size: csv.length }) }),
    } as unknown as Request;

    const res = await route.POST(req);
    const body = await (res as Response).json();
    expect(body.success).toBe(true);
    expect(body.data.summary.processed).toBe(2);
    expect(body.data.summary.created).toBe(1);
    expect(body.data.summary.updated).toBe(1);

    const statuses = (body.data.rows as Array<Record<string, unknown>>).map((r) => String(r['status']));
    expect(statuses).toContain('would-update');
    expect(statuses).toContain('would-create');
  });

  it('JSON dry-run matches by stable-keys and reports would-update', async () => {
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
      findNodeByStableKeys: async (_payload: unknown) => ({ success: true, data: { id: 'found' } }),
      getNodeById: async (_id: string) => ({ success: false, data: null }),
      createNode: async () => ({ success: true, data: { id: 'created' } }),
      updateNode: async () => ({ success: true, data: { id: 'updated' } }),
      upsertNode: async () => ({ success: true, data: { id: 'found' } }),
    }));

    const route = await import('../app/api/import/csv/route');

    const payload = {
      stableKeys: ['external_id'],
      rows: [
        { external_id: 'ext-123', name: 'Existing by stable key' },
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
    expect(body.data.summary.processed).toBe(1);
    expect(body.data.summary.updated).toBe(1);
    const row = (body.data.rows as Array<Record<string, unknown>>)[0];
    expect(String(row['status'])).toBe('would-update');
    expect(String(row['note'])).toBe('matched_by_stable_keys');
  });
});
