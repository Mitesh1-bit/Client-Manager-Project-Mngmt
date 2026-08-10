"use client";

import { useCallback, useState } from "react";

import { useZoomKeyboard } from "./use-zoom-keyboard";

const DEFAULT_MIN = 10;
const DEFAULT_MAX = 24;
const DEFAULT_INITIAL = 13;

export const ZOOM_KEYBOARD_HINT = "Ctrl + / −";

/**
 * Font scaling for code and markdown previews (toolbar buttons + Ctrl/Cmd + +/−).
 *
 * @param {{ initial?: number; min?: number; max?: number; step?: number; enabled?: boolean }} [options]
 */
export function useFontZoom(options = {}) {
  const { initial = DEFAULT_INITIAL, min = DEFAULT_MIN, max = DEFAULT_MAX, step = 1, enabled = true } = options;
  const [fontSize, setFontSize] = useState(initial);

  const zoomIn = useCallback(() => {
    setFontSize((current) => Math.min(max, current + step));
  }, [max, step]);

  const zoomOut = useCallback(() => {
    setFontSize((current) => Math.max(min, current - step));
  }, [min, step]);

  const reset = useCallback(() => {
    setFontSize(initial);
  }, [initial]);

  useZoomKeyboard({
    enabled,
    allowInMonaco: true,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onReset: reset,
  });

  return { fontSize, setFontSize, zoomIn, zoomOut, reset };
}
