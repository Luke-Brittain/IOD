import { NextResponse } from 'next/server';
import { expandSubgraph } from '@/services/graphService';
import { requireAuth, hasRole } from '@/lib/auth';
import { GraphExpandParamsSchema } from '@/lib/validation/schemas';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    if (!hasRole(user, ['viewer', 'steward', 'admin'])) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient role' } }, { status: 403 });
    }
    const url = new URL(req.url);
    const seedPir = url.searchParams.get('seedPir') ?? undefined;
    const capParam = url.searchParams.get('cap');
    const cap = capParam ? parseInt(capParam, 10) : undefined;

    const parsed = GraphExpandParamsSchema.safeParse({ seedPir, cap });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
    }

    const params = parsed.data;
    const res = await expandSubgraph(params.seedPir, params.cap ?? 100);

    if (!res.success) {
      return NextResponse.json(res, { status: 500 });
    }

    // Return with normalized key
    return NextResponse.json({ success: true, data: { subgraph: res.data } });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ success: false, error: { code: 'ERR', message: err?.message ?? 'Unknown' } }, { status });
  }
}
