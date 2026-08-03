import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/app/lib/marketing/site";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

/**
 * @param {{ title?: string, subtitle?: string, eyebrow?: string }} props
 */
export function renderOgImage({ title = SITE_NAME, subtitle, eyebrow = "Agency client delivery" }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0a1550 0%, #1e2875 52%, #0a1550 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#c5f042",
              color: "#0a1550",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{SITE_NAME}</span>
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.72)" }}>{eyebrow}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 920 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 28, lineHeight: 1.35, color: "rgba(255,255,255,0.78)" }}>{subtitle}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <span
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(197,240,66,0.18)",
              color: "#c5f042",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Change requests
          </span>
          <span
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(78,192,232,0.18)",
              color: "#7dd3fc",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Client portal
          </span>
          <span
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(255,226,74,0.16)",
              color: "#ffe24a",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Retention
          </span>
        </div>
      </div>
    ),
    ogImageSize,
  );
}
