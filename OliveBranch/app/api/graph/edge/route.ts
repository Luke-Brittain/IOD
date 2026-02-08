import { NextResponse } from 'next/server';
import { addEdge } from '@/services/graphService';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { GraphEdgeSchema } = await import('@/lib/validation/schemas');
    const parsed = GraphEdgeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
    }

    const { fromId, toId, type } = parsed.data;
    const res = await addEdge(fromId, toId, type);
    return NextResponse.json(res, { status: res.success ? 201 : 500 });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ success: false, error: { code: 'ERR', message: err?.message ?? 'Unknown' } }, { status });
  }
}
