import { describe, it, expect } from 'vitest';
import { hasPermission } from '../lib/auth';

describe('auth.hasPermission', () => {
  it('allows admin for all permissions', () => {
    const admin = { id: 'a1', user_metadata: { role: 'admin' } };
    expect(hasPermission(admin, 'nodes:create')).toBe(true);
    expect(hasPermission(admin, 'nodes:update')).toBe(true);
    expect(hasPermission(admin, 'edges:add')).toBe(true);
    expect(hasPermission(admin, 'anything:else')).toBe(true);
  });

  it('allows editor for node actions but not edges:add', () => {
    const editor = { id: 'e1', user_metadata: { role: 'editor' } };
    expect(hasPermission(editor, 'nodes:create')).toBe(true);
    expect(hasPermission(editor, 'nodes:update')).toBe(true);
    expect(hasPermission(editor, 'edges:add')).toBe(false);
  });

  it('viewer can read nodes only', () => {
    const viewer = { id: 'v1', user_metadata: { role: 'viewer' } };
    expect(hasPermission(viewer, 'nodes:read')).toBe(true);
    expect(hasPermission(viewer, 'nodes:create')).toBe(false);
  });
});
