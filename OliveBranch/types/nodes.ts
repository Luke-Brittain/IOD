/**
 * @file nodes.ts
 * @description TypeScript interfaces for Olive Branch node types and common API response shapes.
 * @module types
 * @author Team
 * @created 2026-02-08
 */

/**
 * System-level object (top-level container for datasets/tables)
 */
export interface System {
  id: string;
  name: string;
  description?: string;
  ownerId?: string; // PersonInRole id (inherited by child assets)
  createdAt: string;
  updatedAt?: string;
}

/**
 * Dataset container (contains tables or tables may be directly under System)
 */
export interface Dataset {
  id: string;
  name: string;
  systemId: string;
  stewards?: string[]; // PersonInRole ids
  createdAt: string;
  updatedAt?: string;
}

/**
 * Table within a dataset
 */
export interface Table {
  id: string;
  name: string;
  datasetId: string;
  stewards?: string[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Field (column) metadata
 */
export interface Field {
  id: string;
  name: string;
  tableId: string;
  pii: boolean; // mandatory Yes/No in MVP
  dataType?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Calculated metric or report
 */
export interface CalculatedMetric {
  id: string;
  name: string;
  primarySystemId?: string; // Option A: Primary System anchor
  derivedFromIds: string[]; // node ids it derives from
  createdAt: string;
  updatedAt?: string;
}

/**
 * Person-in-Role representing governance contacts
 */
export interface PersonInRole {
  id: string;
  fullName: string;
  role: 'Data Governance Lead' | 'System Administrator' | 'Data Owner' | 'Data Steward' | string;
  email?: string;
  createdAt: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}
