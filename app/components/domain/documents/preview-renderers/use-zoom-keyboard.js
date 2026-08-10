"use client";

import { useEffect } from "react";

/**
 * @param {EventTarget | null | undefined} target
 */
function isTextEntryTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Ctrl/Cmd + +/−/0 zoom shortcuts. Prevents browser page zoom while a preview is open.
 *
 * @param {{ onZoomIn?: () => void; onZoomOut?: () => void; onReset?: () => void; enabled?: boolean; allowInMonaco?: boolean }} options
 */
export function useZoomKeyboard({
  onZoomIn,
  onZoomOut,
  onReset,
  enabled = true,
  allowInMonaco = false,
}) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event) {
      if (!event.ctrlKey && !event.metaKey) return;

      const target = event.target;
      if (isTextEntryTarget(target)) return;
      if (!allowInMonaco && target instanceof HTMLElement && target.closest(".monaco-editor")) return;

      const { key } = event;

      if (key === "=" || key === "+" || key === "Add") {
        event.preventDefault();
        onZoomIn?.();
        return;
      }

      if (key === "-" || key === "_" || key === "Subtract") {
        event.preventDefault();
        onZoomOut?.();
        return;
      }

      if (key === "0" || key === "Digit0") {
        event.preventDefault();
        onReset?.();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allowInMonaco, enabled, onReset, onZoomIn, onZoomOut]);
}
