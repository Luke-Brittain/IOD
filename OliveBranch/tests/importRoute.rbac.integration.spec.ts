import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('import/csv route (rbac rejection)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns 403 when requirePermission throws', async () => {
    vi.doMock('next/server', () => ({
      NextResponse: { json: (body: unknown, init?: unknown) => new Response(JSON.stringify(body), init as any) },
    }));

    vi.doMock('@/lib/authMiddleware', () => ({
      requirePermission: async () => { throw { status: 403, message: 'Forbidden' }; },
    }));

    // minimal schema mock so route doesn't fail earlier
    vi.doMock('@/lib/validation/schemas', () => ({
      ImportRowsSchema: { safeParse: (b: any) => ({ success: !!b && Array.isArray(b.rows), data: b }) },
    }));

    const route = await import('../app/api/import/csv/route');

    const payload = { rows: [{ name: 'Ignored' }] };
    const req = new Request('http://localhost/api/import/csv', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await route.POST(req as unknown as Request);
    const body = await (res as Response).json();
    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
    expect(body.error.message).toBe('Forbidden');
  });
});
