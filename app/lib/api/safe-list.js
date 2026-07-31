/**
 * Backend returns flat arrays ([CompanyType!]!) but legacy mock code used
 * Connection { nodes }. Always coerce to an array before .map / .length.
 *
 * @param {unknown} value
 * @returns {unknown[]}
 */
export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray(value.nodes)) return value.nodes;
  return [];
}

/**
 * @param {Record<string, unknown> | null | undefined} data
 * @param {string} key
 */
export function pickList(data, key) {
  return asArray(data?.[key]);
}
