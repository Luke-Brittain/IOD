import fs from 'fs';
import path from 'path';
import { requirePermission } from '@/lib/authMiddleware';
import ROLE_PERMISSIONS from '@/config/roles';
import RolesSchema, { Roles as RolesType } from '@/lib/validation/rolesSchema';

const ROLES_PATH = path.join(process.cwd(), 'OliveBranch', 'config', 'roles.json');

export async function GET() {
  try {
    // Prefer environment-provided mapping (handled by config module), but return current file contents if present
    if (fs.existsSync(ROLES_PATH)) {
      const raw = fs.readFileSync(ROLES_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return new Response(JSON.stringify({ success: true, data: parsed }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: true, data: ROLE_PERMISSIONS }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ success: false, error: { code: 'ERR', message: 'Failed to read roles' } }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}

export async function PUT(req: Request) {
  try {
    // ensure caller is admin and capture user
    const user = await requirePermission(req, 'admin:*');
    const body = await req.json();
    const parse = RolesSchema.safeParse(body);
    if (!parse.success) {
      return new Response(JSON.stringify({ success: false, error: { code: 'VALIDATION_ERROR', message: parse.error.flatten() } }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const roles: RolesType = parse.data;

    // Read existing roles to compute diff
    let oldRoles: Record<string, string[]> = {};
    if (fs.existsSync(ROLES_PATH)) {
      try {
        oldRoles = JSON.parse(fs.readFileSync(ROLES_PATH, 'utf-8')) as Record<string, string[]>;
      } catch (e) {
        oldRoles = {};
      }
    } else {
      oldRoles = ROLE_PERMISSIONS as Record<string, string[]>;
    }

    // Persist to roles.json
    fs.mkdirSync(path.dirname(ROLES_PATH), { recursive: true });
    fs.writeFileSync(ROLES_PATH, JSON.stringify(roles, null, 2), 'utf-8');

    // Compute a simple diff between oldRoles and roles
    const diff: Record<string, { added?: string[]; removed?: string[]; changed?: boolean }> = {};
    const allKeys = new Set([...Object.keys(oldRoles), ...Object.keys(roles)]);
    for (const k of allKeys) {
      const oldPerms = new Set(oldRoles[k] ?? []);
      const newPerms = new Set(roles[k] ?? []);
      const added = [...newPerms].filter((p) => !oldPerms.has(p));
      const removed = [...oldPerms].filter((p) => !newPerms.has(p));
      if (added.length || removed.length) {
        diff[k] = {};
        if (added.length) diff[k].added = added;
        if (removed.length) diff[k].removed = removed;
      }
    }

    // Audit log: rotate if too large, then append JSON line with diff
    const auditDir = path.join(process.cwd(), 'OliveBranch', 'logs');
    fs.mkdirSync(auditDir, { recursive: true });
    const auditPath = path.join(auditDir, 'roles-audit.log');
    try {
      if (fs.existsSync(auditPath)) {
        const stats = fs.statSync(auditPath);
        const MAX_BYTES = 50 * 1024; // 50 KB
        if (stats.size > MAX_BYTES) {
          const archived = path.join(auditDir, `roles-audit-${Date.now()}.log`);
          fs.renameSync(auditPath, archived);
        }
      }
    } catch (e) {
      // best-effort rotation
    }

    const userId = (user && typeof user === 'object' && 'id' in user) ? (user as Record<string, unknown>).id as string : 'unknown';
    const entry = JSON.stringify({ timestamp: new Date().toISOString(), user: userId ?? 'unknown', action: 'update_roles', diff }) + '\n';
    try { fs.appendFileSync(auditPath, entry, 'utf-8'); } catch (e) { /* best-effort */ }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? (err as Record<string, unknown>).status as number : 500;
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return new Response(JSON.stringify({ success: false, error: { code: 'ERR', message } }), { status, headers: { 'content-type': 'application/json' } });
  }
}
