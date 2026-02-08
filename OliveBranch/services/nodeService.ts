/**
 * services/nodeService.ts
 * Business-layer functions for node CRUD and listing. Uses Supabase for attribute storage and Neo4j for topology where needed.
 */

import type { ApiResponse } from '../types/nodes';
import type { System, Dataset, Table, Field, CalculatedMetric } from '../types/nodes';
import { getSupabaseServer } from '../lib/supabase/client';
import { hasPermission } from '../lib/auth';
import { getStableKeys } from '@/config/stableKeys';

const supabase = getSupabaseServer();

export async function getNodeById(id: string): Promise<ApiResponse<unknown>> {
  try {
    const { data, error } = await supabase.from('nodes').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return { success: true, data };
  } catch (err: unknown) {
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return { success: false, error: { code: 'DB_ERROR', message } };
  }
}

export async function listNodesRoleScoped(seedPir?: string, cap = 100): Promise<ApiResponse<unknown>> {
  try {
    // Implementation note: role-scoped expansion will combine graph traversal (neo4j) with node attribute fetches.
    // For Phase 1 we provide a simple supabase-backed placeholder that selects visible nodes by owner/steward.

    if (!seedPir) {
      const { data, error } = await supabase.from('nodes').select('*').limit(cap);
      if (error) throw error;
      return { success: true, data };
    }

    // When seedPir provided, select nodes where ownerId == seedPir OR stewards contains seedPir
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .or(`ownerId.eq.${seedPir},stewards.cs.{${seedPir}}`)
      .limit(cap);

    if (error) throw error;

    return { success: true, data };
  } catch (err: unknown) {
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return { success: false, error: { code: 'DB_ERROR', message } };
  }
}
export async function createNode(
  user: unknown,
  node: Partial<System | Dataset | Table | Field | CalculatedMetric>
): Promise<ApiResponse<unknown>> {
  try {
    if (!hasPermission(user, 'nodes:create')) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient role to create node' } };
    }

    const { data, error } = await supabase.from('nodes').insert(node).select().single();
    if (error) throw error;
    return { success: true, data };
  } catch (err: unknown) {
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return { success: false, error: { code: 'DB_ERROR', message } };
  }
}

export async function updateNode(user: unknown, id: string, patch: Record<string, unknown>): Promise<ApiResponse<unknown>> {
  try {
    // Authorization: admins and stewards/editors may update; owners/stewards of the node may also update.
    // If user lacks permission to update nodes, still allow owner/steward checks below
    const canUpdateByRole = hasPermission(user, 'nodes:update');

    const nodeRes = await getNodeById(id);
    if (!nodeRes.success) return nodeRes;
    const node = nodeRes.data as Record<string, unknown> | null;

    const u = typeof user === 'object' && user !== null ? (user as Record<string, unknown>) : undefined;
    const userId = u?.id as string | undefined;
    const isOwner = !!(node && node.ownerId && userId && node.ownerId === userId);
    const isSteward = !!(node && Array.isArray(node.stewards) && (node.stewards as unknown[]).includes(userId));

    if (!canUpdateByRole && !isOwner && !isSteward) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient role to update node' } };
    }

    // Respect blank-value merge rules: caller should filter out blank values before calling this function.
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }

    const { data, error } = await supabase.from('nodes').update(cleaned).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, data };
  } catch (err: unknown) {
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return { success: false, error: { code: 'DB_ERROR', message } };
  }
}

export async function upsertNode(
  user: unknown,
  node: Record<string, unknown>,
  stableKeys?: string[]
): Promise<ApiResponse<unknown>> {
  try {
    const keys = stableKeys && stableKeys.length ? stableKeys : getStableKeys();
    // Build match object from provided keys that exist on the payload
    const match: Record<string, unknown> = {};
    for (const k of keys) {
      if (k in node && node[k] !== undefined && node[k] !== null && node[k] !== '') {
        match[k] = node[k] as unknown;
      }
    }

    if (Object.keys(match).length > 0) {
      // Try to find existing by stable key(s)
      const { data: existing, error: selErr } = await supabase.from('nodes').select('*').match(match).maybeSingle();
      if (selErr) throw selErr;
      if (existing && existing.id) {
        // merge behavior: respect blank-value merge rules in updateNode
        return await updateNode(user, existing.id as string, node);
      }
    }

    // No match - create new
    return await createNode(user, node as any);
  } catch (err: unknown) {
    const message = typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string' ? (err as Record<string, unknown>).message as string : 'Unknown';
    return { success: false, error: { code: 'DB_ERROR', message } };
  }
}
