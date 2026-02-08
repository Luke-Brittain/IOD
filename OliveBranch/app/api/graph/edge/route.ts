import { NextResponse } from 'next/server';
import { addEdge } from '@/services/graphService';
import { requireAuth } from '@/lib/auth';
import { GraphEdgeSchema } from '@/lib/validation/schemas';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const parsed = GraphEdgeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
    }

    const { fromId, toId, type } = parsed.data;
    const res = await addEdge(user, fromId, toId, type);
    if (!res.success) return NextResponse.json(res, { status: 500 });
    return NextResponse.json({ success: true, data: { edge: res.data } }, { status: 201 });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
}
