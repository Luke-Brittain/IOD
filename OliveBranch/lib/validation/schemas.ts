/**
 * lib/validation/schemas.ts
 * Zod validation schemas for API requests and payloads.
 */

import { z } from 'zod';

export const NodeBase = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const SystemSchema = NodeBase.extend({
  description: z.string().optional(),
  ownerId: z.string().optional(),
});

export const DatasetSchema = NodeBase.extend({
  systemId: z.string(),
  stewards: z.array(z.string()).optional(),
});

export const TableSchema = NodeBase.extend({
  datasetId: z.string(),
  stewards: z.array(z.string()).optional(),
});

export const FieldSchema = NodeBase.extend({
  tableId: z.string(),
  pii: z.boolean(),
  dataType: z.string().optional(),
});

export const CalculatedMetricSchema = NodeBase.extend({
  primarySystemId: z.string().optional(),
  derivedFromIds: z.array(z.string()).optional(),
});

export const NodeCreateSchema = z.union([
  SystemSchema,
  DatasetSchema,
  TableSchema,
  FieldSchema,
  CalculatedMetricSchema,
]);

export const NodePatchSchema = z.record(z.any());

export const ImportRowsSchema = z.object({ rows: z.array(z.record(z.any())) });

export const GraphEdgeSchema = z.object({ fromId: z.string(), toId: z.string(), type: z.string() });

export const GraphTraverseParamsSchema = z.object({
  nodeId: z.string(),
  direction: z.enum(['upstream', 'downstream']).optional(),
  depth: z.number().int().min(1).max(10).optional(),
});

export const GraphExpandParamsSchema = z.object({ seedPir: z.string(), cap: z.number().int().min(1).max(1000).optional() });
