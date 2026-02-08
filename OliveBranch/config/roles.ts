import fs from 'fs';
import path from 'path';

// Try to load ROLE_PERMISSIONS from environment variable first (JSON string),
// then from the roles.json file in the config directory. If neither is present
// or parsing fails, fall back to the built-in default mapping.

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['nodes:create', 'nodes:update', 'nodes:read', 'edges:add', 'audit:write', 'admin:*'],
  steward: ['nodes:create', 'nodes:update', 'nodes:read', 'edges:add'],
  editor: ['nodes:create', 'nodes:update', 'nodes:read'],
  viewer: ['nodes:read'],
};

function loadFromEnv(): Record<string, string[]> | null {
  const raw = process.env.ROLES_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string, string[]>;
  } catch (e) {
    // ignore and fallback
  }
  return null;
}

function loadFromFile(): Record<string, string[]> | null {
  try {
    const file = path.join(process.cwd(), 'OliveBranch', 'config', 'roles.json');
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string, string[]>;
  } catch (e) {
    // ignore and fallback
  }
  return null;
}

export const ROLE_PERMISSIONS: Record<string, string[]> = loadFromEnv() ?? loadFromFile() ?? DEFAULT_ROLE_PERMISSIONS;

export default ROLE_PERMISSIONS;
