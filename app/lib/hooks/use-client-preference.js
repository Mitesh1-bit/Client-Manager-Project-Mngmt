"use client";

import { useEffect, useState } from "react";

/**
 * Avoid hydration mismatch for values read from localStorage.
 *
 * @template T
 * @param {() => T} read
 * @param {T} fallback
 */
export function useClientPreference(read, fallback) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    setValue(read());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, setValue];
}
