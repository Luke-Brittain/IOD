import { NextResponse } from 'next/server';
import { traverse } from '@/services/graphService';
import { requireAnyPermission } from '@/lib/authMiddleware';
import { GraphTraverseParamsSchema } from '@/lib/validation/schemas';

export async function GET(req: Request) {
  try {
    await requireAnyPermission(req, ['nodes:read', 'edges:add']);
    const url = new URL(req.url);
    const nodeId = url.searchParams.get('nodeId') ?? undefined;
    const direction = (url.searchParams.get('direction') as 'upstream' | 'downstream') ?? undefined;
    const depthParam = url.searchParams.get('depth');
    const depth = depthParam ? parseInt(depthParam, 10) : undefined;

    const parsed = GraphTraverseParamsSchema.safeParse({ nodeId, direction, depth });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
    }

    const params = parsed.data;
    const res = await traverse(params.nodeId, params.direction ?? 'upstream', params.depth ?? 3);

    if (!res.success) {
      return NextResponse.json(res, { status: 500 });
    }

    // Normalize to stricter response shape
    return NextResponse.json({ success: true, data: { traversal: res.data } });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
}
