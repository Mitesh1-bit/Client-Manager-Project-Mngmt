"use client";

import { useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { TransformWrapper, TransformComponent, useControls, useTransformEffect } from "react-zoom-pan-pinch";

import { Button } from "@/app/components/ui/button";
import { useZoomKeyboard } from "./use-zoom-keyboard";
import { ZOOM_KEYBOARD_HINT } from "./use-font-zoom";

const ZOOM_PAN_PINCH = {
  wheel: { disabled: true, touchPadDisabled: true },
  panning: { velocityDisabled: true },
  doubleClick: { disabled: true },
};

function ZoomKeyboardBridge() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  useZoomKeyboard({
    onZoomIn: () => zoomIn(0.15),
    onZoomOut: () => zoomOut(0.15),
    onReset: () => resetTransform(),
  });

  return null;
}

/**
 * @param {{ className?: string; hint?: string }} props
 */
function ZoomToolbar({ className = "", hint = ZOOM_KEYBOARD_HINT }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const [scale, setScale] = useState(100);

  useTransformEffect(({ state }) => {
    setScale(Math.round(state.scale * 100));
  });

  return (
    <div
      className={`flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-sm backdrop-blur-sm ${className}`.trim()}
    >
      <span className="hidden max-w-[7rem] truncate px-1 text-[0.65rem] text-muted-foreground sm:inline">{hint}</span>
      <Button type="button" variant="ghost" size="icon-sm" onClick={() => zoomOut()} aria-label="Zoom out">
        <Minus aria-hidden="true" className="size-3.5" />
      </Button>
      <span className="tabular min-w-[2.75rem] text-center text-[0.65rem] text-muted-foreground">{scale}%</span>
      <Button type="button" variant="ghost" size="icon-sm" onClick={() => zoomIn()} aria-label="Zoom in">
        <Plus aria-hidden="true" className="size-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={() => resetTransform()} aria-label="Reset zoom">
        <Maximize2 aria-hidden="true" className="size-3.5" />
      </Button>
    </div>
  );
}

/**
 * Pan/zoom surface for images and SVG. Ctrl/Cmd + +/− to zoom, drag to pan, or use toolbar buttons.
 *
 * @param {{ children: React.ReactNode; className?: string; contentClassName?: string; minScale?: number; maxScale?: number }} props
 */
export function ZoomableView({
  children,
  className = "",
  contentClassName = "",
  minScale = 0.25,
  maxScale = 6,
}) {
  return (
    <div className={`relative h-full min-h-0 w-full ${className}`.trim()}>
      <TransformWrapper
        initialScale={1}
        minScale={minScale}
        maxScale={maxScale}
        centerOnInit
        limitToBounds={false}
        {...ZOOM_PAN_PINCH}
      >
        <ZoomKeyboardBridge />
        <ZoomToolbar className="absolute top-3 right-3 z-10" />
        <TransformComponent wrapperClass="!h-full !w-full" contentClass="!flex !h-full !w-full items-center justify-center p-4">
          <div className={contentClassName}>{children}</div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}

/**
 * @param {{ value: number; onZoomIn: () => void; onZoomOut: () => void; onReset: () => void; hint?: string; className?: string }} props
 */
export function FontZoomToolbar({ value, onZoomIn, onZoomOut, onReset, hint = ZOOM_KEYBOARD_HINT, className = "" }) {
  return (
    <div className={`flex items-center gap-1 ${className}`.trim()}>
      <span className="hidden text-[0.65rem] text-muted-foreground lg:inline">{hint}</span>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onZoomOut} aria-label="Decrease text size">
        <Minus aria-hidden="true" className="size-3.5" />
      </Button>
      <span className="tabular min-w-[2rem] text-center text-[0.65rem] text-muted-foreground">{value}px</span>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onZoomIn} aria-label="Increase text size">
        <Plus aria-hidden="true" className="size-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onReset} aria-label="Reset text size">
        <Maximize2 aria-hidden="true" className="size-3.5" />
      </Button>
    </div>
  );
}
