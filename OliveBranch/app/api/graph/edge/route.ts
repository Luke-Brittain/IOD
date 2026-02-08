import { NextResponse } from 'next/server';
import { addEdge } from '@/services/graphService';
import { requireAuth, hasRole } from '@/lib/auth';
import { GraphEdgeSchema } from '@/lib/validation/schemas';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    if (!hasRole(user, ['admin', 'steward'])) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient role' } }, { status: 403 });
    }
    const body = await req.json();

    const parsed = GraphEdgeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
    }

    const { fromId, toId, type } = parsed.data;
    const res = await addEdge(fromId, toId, type);
    if (!res.success) return NextResponse.json(res, { status: 500 });
    return NextResponse.json({ success: true, data: { edge: res.data } }, { status: 201 });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ success: false, error: { code: 'ERR', message: err?.message ?? 'Unknown' } }, { status });
  }
}
