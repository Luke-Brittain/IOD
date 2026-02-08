import { NextResponse } from 'next/server';
import { traverse } from '@/services/graphService';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await requireAuth(req);
    const url = new URL(req.url);
    const nodeId = url.searchParams.get('nodeId');
    const direction = (url.searchParams.get('direction') as 'upstream' | 'downstream') || 'upstream';
    const depth = parseInt(url.searchParams.get('depth') ?? '3', 10);

    if (!nodeId) return NextResponse.json({ success: false, error: { code: 'MISSING_PARAM', message: 'nodeId is required' } }, { status: 400 });

    const res = await traverse(nodeId, direction, depth);
    return NextResponse.json(res);
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ success: false, error: { code: 'ERR', message: err?.message ?? 'Unknown' } }, { status });
  }
}
