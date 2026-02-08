/**
 * Configuration for stable key upsert behavior.
 *
 * Supports overriding via `STABLE_KEYS` environment variable as comma-separated list.
 */
export function getStableKeys(): string[] {
  const env = process.env.STABLE_KEYS;
  if (env && env.trim().length > 0) {
    return env.split(',').map((s) => s.trim()).filter(Boolean);
  }
  // Default: single stable key 'external_id'
  return ['external_id'];
}

export default getStableKeys;
