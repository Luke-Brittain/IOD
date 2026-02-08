import { NextResponse } from 'next/server';
import { createNode, updateNode, getNodeById } from '@/services/nodeService';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const ct = req.headers.get('content-type') || '';

    // For MVP accept JSON array of rows for simplicity: { rows: [{ id, type, name, ... }, ...] }
    if (ct.includes('application/json')) {
      const body = await req.json();
      const { ImportRowsSchema } = await import('@/lib/validation/schemas');
      const parsed = ImportRowsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
      }
      const rows = parsed.data.rows;
      const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
      const rowResults: unknown[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (row.id) {
            const existing = await getNodeById(row.id);
            if (existing.success && existing.data) {
              await updateNode(user, row.id, row);
              summary.updated++;
              rowResults.push({ row: i + 1, status: 'updated' });
              continue;
            }
          }

          await createNode(user, row);
          summary.created++;
          rowResults.push({ row: i + 1, status: 'created' });
        } catch (e: unknown) {
          summary.errors++;
          const message = typeof e === 'object' && e !== null && 'message' in e && typeof (e as Record<string, unknown>).message === 'string' ? (e as Record<string, unknown>).message as string : 'unknown';
          rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message });
        }
      }

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    // If multipart/form-data is required, return not implemented for now.
    if (ct.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Multipart CSV import not implemented in MVP API stub. Send JSON { rows: [...] } for import tests.' } }, { status: 501 });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Use application/json with { rows: [...] } or multipart/form-data (not implemented).' } }, { status: 400 });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
}
