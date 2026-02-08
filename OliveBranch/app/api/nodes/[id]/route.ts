import { NextResponse } from 'next/server';
import { getNodeById, updateNode } from '@/services/nodeService';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const id = params.id;
    const res = await getNodeById(id);
    return NextResponse.json(res);
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ success: false, error: { code: 'ERR', message: err?.message ?? 'Unknown' } }, { status });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const id = params.id;
    const body = await req.json();
    const { NodePatchSchema } = await import('@/lib/validation/schemas');
    const parsed = NodePatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
    }

    const res = await updateNode(id, parsed.data as Record<string, unknown>);
    return NextResponse.json(res);
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ success: false, error: { code: 'ERR', message: err?.message ?? 'Unknown' } }, { status });
  }
}
