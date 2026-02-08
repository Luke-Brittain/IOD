import { z } from 'zod';

// Roles mapping: record of roleName -> array of permission strings
export const RolesSchema = z.record(z.array(z.string().min(1)));

export type Roles = z.infer<typeof RolesSchema>;

export default RolesSchema;
