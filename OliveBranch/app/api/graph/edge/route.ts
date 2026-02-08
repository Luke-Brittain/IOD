import { NextResponse } from 'next/server';
import { addEdge } from '@/services/graphService';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { fromId, toId, type } = body || {};
    if (!fromId || !toId || !type) return NextResponse.json({ success: false, error: { code: 'INVALID_BODY', message: 'fromId, toId and type are required' } }, { status: 400 });

    const res = await addEdge(fromId, toId, type);
    return NextResponse.json(res, { status: res.success ? 201 : 500 });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ success: false, error: { code: 'ERR', message: err?.message ?? 'Unknown' } }, { status });
  }
}
