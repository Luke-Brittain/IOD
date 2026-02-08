import { NextResponse } from 'next/server';
import { listNodesRoleScoped, createNode } from '@/services/nodeService';
import { requireAnyPermission, requirePermission } from '@/lib/authMiddleware';
import { NodeCreateSchema } from '@/lib/validation/schemas';

export async function GET(req: Request) {
  try {
    await requireAnyPermission(req, ['nodes:read']);
    const url = new URL(req.url);
    const roleScoped = url.searchParams.get('roleScoped') === 'true';
    const seedPir = url.searchParams.get('seedPir') ?? undefined;
    const cap = parseInt(url.searchParams.get('cap') ?? '100', 10);

    const res = await listNodesRoleScoped(roleScoped ? seedPir : undefined, cap);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requirePermission(req, 'nodes:create');
    const body = await req.json();
    const parsed = NodeCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } }, { status: 400 });
    }

    const res = await createNode(user, parsed.data);
    const status = res.success ? 201 : 500;
    return NextResponse.json(res, { status });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return NextResponse.json({ success: false, error: { code: 'ERR', message } }, { status });
  }
}
