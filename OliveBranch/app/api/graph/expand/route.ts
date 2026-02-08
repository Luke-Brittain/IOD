import { NextResponse } from 'next/server';
import { expandSubgraph } from '@/services/graphService';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await requireAuth(req);
    const url = new URL(req.url);
    const seedPir = url.searchParams.get('seedPir');
    const cap = parseInt(url.searchParams.get('cap') ?? '100', 10);

    if (!seedPir) return NextResponse.json({ success: false, error: { code: 'MISSING_PARAM', message: 'seedPir is required' } }, { status: 400 });

    const res = await expandSubgraph(seedPir, cap);
    return NextResponse.json(res);
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ success: false, error: { code: 'ERR', message: err?.message ?? 'Unknown' } }, { status });
  }
}
