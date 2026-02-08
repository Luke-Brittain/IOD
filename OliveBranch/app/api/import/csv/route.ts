import { NextResponse } from 'next/server';
import { createNode, updateNode, getNodeById } from '@/services/nodeService';

function requireAuth(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth) throw { status: 401, message: 'Unauthorized' };
  return auth.replace('Bearer ', '');
}

export async function POST(req: Request) {
  try {
    requireAuth(req);
    const ct = req.headers.get('content-type') || '';

    // For MVP accept JSON array of rows for simplicity: { rows: [{ id, type, name, ... }, ...] }
    if (ct.includes('application/json')) {
      const body = await req.json();
      const rows = Array.isArray(body.rows) ? body.rows : [];
      const summary = { processed: rows.length, created: 0, updated: 0, errors: 0 };
      const rowResults: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (row.id) {
            const existing = await getNodeById(row.id);
            if (existing.success && existing.data) {
              await updateNode(row.id, row);
              summary.updated++;
              rowResults.push({ row: i + 1, status: 'updated' });
              continue;
            }
          }

          await createNode(row);
          summary.created++;
          rowResults.push({ row: i + 1, status: 'created' });
        } catch (e: any) {
          summary.errors++;
          rowResults.push({ row: i + 1, status: 'error', code: 'IMPORT_ERROR', message: e?.message ?? 'unknown' });
        }
      }

      return NextResponse.json({ success: true, data: { summary, rows: rowResults } });
    }

    // If multipart/form-data is required, return not implemented for now.
    if (ct.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Multipart CSV import not implemented in MVP API stub. Send JSON { rows: [...] } for import tests.' } }, { status: 501 });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Use application/json with { rows: [...] } or multipart/form-data (not implemented).' } }, { status: 400 });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ success: false, error: { code: 'ERR', message: err?.message ?? 'Unknown' } }, { status });
  }
}
