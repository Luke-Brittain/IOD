/**
 * services/nodeService.ts
 * Business-layer functions for node CRUD and listing. Uses Supabase for attribute storage and Neo4j for topology where needed.
 */

import type { ApiResponse } from '@/types/nodes';
import type { System, Dataset, Table, Field, CalculatedMetric } from '@/types/nodes';
import { getSupabaseServer } from '@/lib/supabase/client';

const supabase = getSupabaseServer();

export async function getNodeById(id: string): Promise<ApiResponse<any>> {
  try {
    const { data, error } = await supabase.from('nodes').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: { code: 'DB_ERROR', message: err.message } };
  }
}

export async function listNodesRoleScoped(seedPir?: string, cap = 100): Promise<ApiResponse<any>> {
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
  } catch (err: any) {
    return { success: false, error: { code: 'DB_ERROR', message: err.message } };
  }
}

export async function createNode(node: Partial<System | Dataset | Table | Field | CalculatedMetric>): Promise<ApiResponse<any>> {
  try {
    const { data, error } = await supabase.from('nodes').insert(node).select().single();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: { code: 'DB_ERROR', message: err.message } };
  }
}

export async function updateNode(id: string, patch: Record<string, unknown>): Promise<ApiResponse<any>> {
  try {
    // Respect blank-value merge rules: caller should filter out blank values before calling this function.
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }

    const { data, error } = await supabase.from('nodes').update(cleaned).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: { code: 'DB_ERROR', message: err.message } };
  }
}
