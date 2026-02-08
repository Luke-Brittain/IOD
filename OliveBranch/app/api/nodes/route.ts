import { NextResponse } from 'next/server';
import { listNodesRoleScoped, createNode } from '@/services/nodeService';
import { requireAuth, hasRole } from '@/lib/auth';
import { NodeCreateSchema } from '@/lib/validation/schemas';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const url = new URL(req.url);
    const roleScoped = url.searchParams.get('roleScoped') === 'true';
    const seedPir = url.searchParams.get('seedPir') ?? undefined;
    const cap = parseInt(url.searchParams.get('cap') ?? '100', 10);

    const res = await listNodesRoleScoped(roleScoped ? seedPir : undefined, cap);
    return NextResponse.json(res);
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ success: false, error: { code: 'ERR', message: err?.message ?? 'Unknown' } }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const parsed = NodeCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
    }

    const res = await createNode(user, parsed.data);
    const status = res.success ? 201 : 500;
    return NextResponse.json(res, { status });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ success: false, error: { code: 'ERR', message: err?.message ?? 'Unknown' } }, { status });
  }
}
