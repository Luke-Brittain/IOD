/**
 * services/graphService.ts
 * Graph traversal and edge management for lineage topology.
 */

import { getSession } from '@/lib/graph/client';
import type { ApiResponse } from '@/types/nodes';
import { getNodeById } from '@/services/nodeService';

/**
 * Traverse upstream or downstream from a nodeId to a given depth.
 */
export async function traverse(nodeId: string, direction: 'upstream' | 'downstream', depth = 3): Promise<ApiResponse<any>> {
  const session = getSession();
  try {
    let cypher = '';
    if (direction === 'upstream') {
      cypher = `MATCH (n {id: $nodeId})<-[:derived_from|contains*1..${depth}]-(m) RETURN m LIMIT 100`;
    } else {
      cypher = `MATCH (n {id: $nodeId})-[:derived_from|contains*1..${depth}]->(m) RETURN m LIMIT 100`;
    }

    const result = await session.run(cypher, { nodeId });
    const nodes = result.records.map((r) => r.get('m'));
    return { success: true, data: { nodes } };
  } catch (err: any) {
    return { success: false, error: { code: 'GRAPH_ERROR', message: err.message } };
  } finally {
    await session.close();
  }
}

/**
 * Expand subgraph from a seed Person-in-Role (seedPir) up to a cap.
 */
export async function expandSubgraph(seedPir: string, cap = 100): Promise<ApiResponse<any>> {
  const session = getSession();
  try {
    const cypher = `MATCH (pir:PersonInRole {id: $seedPir})-[:owns|stewards*0..2]-(n) RETURN n LIMIT $cap`;
    const result = await session.run(cypher, { seedPir, cap: neo4jInt(cap) });
    const nodes = result.records.map((r) => r.get('n'));
    return { success: true, data: { nodes } };
  } catch (err: any) {
    return { success: false, error: { code: 'GRAPH_ERROR', message: err.message } };
  } finally {
    await session.close();
  }
}

/**
 * Add an edge between two node ids.
 */
export async function addEdge(user: any, fromId: string, toId: string, type: string): Promise<ApiResponse<any>> {
  const session = getSession();
  try {
    // Authorize: admin and steward can bypass owner checks
    const role = user?.user_metadata?.role || user?.app_metadata?.role || user?.role;
    if (!role) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'Unauthenticated' } };
    }

    if (!['admin', 'steward'].includes(role)) {
      // For non-admin/steward users, ensure they have update rights on both nodes (owner or steward)
      const a = await getNodeById(fromId);
      const b = await getNodeById(toId);
      if (!a.success) return a;
      if (!b.success) return b;
      const nodeA = a.data as any;
      const nodeB = b.data as any;

      const userId = user?.id;
      const canModifyA = nodeA?.ownerId === userId || (Array.isArray(nodeA?.stewards) && nodeA.stewards.includes(userId));
      const canModifyB = nodeB?.ownerId === userId || (Array.isArray(nodeB?.stewards) && nodeB.stewards.includes(userId));

      if (!canModifyA || !canModifyB) {
        return { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions on source or target node' } };
      }
    }

    const cypher = `MATCH (a {id: $fromId}), (b {id: $toId}) MERGE (a)-[r:${type}]->(b) RETURN r`;
    const result = await session.run(cypher, { fromId, toId });
    const rel = result.records[0]?.get('r');
    return { success: true, data: { rel } };
  } catch (err: any) {
    return { success: false, error: { code: 'GRAPH_ERROR', message: err.message } };
  } finally {
    await session.close();
  }
}

// Helper for neo4j integer handling (lazy import to avoid top-level import issues when not installed)
function neo4jInt(n: number) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const neo4j = require('neo4j-driver');
    return neo4j.int(n);
  } catch {
    return n;
  }
}
