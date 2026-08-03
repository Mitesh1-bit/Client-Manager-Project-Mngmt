"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";

/**
 * Scales a fixed-size design canvas to fit its container width.
 * Keeps the same visual design on all breakpoints — only the scale changes.
 */
export function MktScaleViewport({
  designWidth,
  designHeight,
  topInset = 0,
  scaleBelow = 0,
  className,
  innerClassName,
  children,
}) {
  const viewportRef = useRef(null);
  const [layout, setLayout] = useState({
    scale: 1,
    offsetX: 0,
    height: designHeight + topInset,
    fluid: scaleBelow > 0,
  });

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;

    const available = el.getBoundingClientRect().width;
    if (available <= 0) return;

    const shouldScale = scaleBelow <= 0 || window.innerWidth < scaleBelow;

    if (!shouldScale) {
      setLayout({
        scale: 1,
        offsetX: 0,
        height: designHeight + topInset,
        fluid: true,
      });
      return;
    }

    const scale = Math.min(1, available / designWidth);
    const scaledWidth = designWidth * scale;
    const offsetX = Math.max(0, (available - scaledWidth) / 2);
    const height = (designHeight + topInset) * scale;

    setLayout({ scale, offsetX, height, fluid: false });
  }, [designWidth, designHeight, topInset, scaleBelow]);

  useEffect(() => {
    measure();

    const el = viewportRef.current;
    if (!el) return undefined;

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure]);

  return (
    <div
      ref={viewportRef}
      className={cn(
        "relative mx-auto w-full max-w-full",
        !layout.fluid && "overflow-hidden",
        className,
      )}
      style={layout.fluid ? undefined : { height: layout.height }}
    >
      <div
        className={cn(layout.fluid ? "relative w-full" : "absolute left-0 top-0", innerClassName)}
        style={
          layout.fluid
            ? undefined
            : {
                width: designWidth,
                height: designHeight + topInset,
                paddingTop: topInset,
                transform: `translateX(${layout.offsetX}px) scale(${layout.scale})`,
                transformOrigin: "top left",
                WebkitTransform: `translateX(${layout.offsetX}px) scale(${layout.scale})`,
              }
        }
      >
        {children}
      </div>
    </div>
  );
}
