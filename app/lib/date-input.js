/** Normalize API/ISO dates for `<input type="date">` (YYYY-MM-DD). */
export function toDateInputValue(value) {
  if (!value) return "";
  const str = String(value);
  return str.length >= 10 ? str.slice(0, 10) : str;
}

/** Pass through for GraphQL `Date` scalars — null clears optional dates. */
export function toApiDate(value) {
  return value || null;
}
