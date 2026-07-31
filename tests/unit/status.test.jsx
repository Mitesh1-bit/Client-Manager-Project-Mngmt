import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "@/app/components/domain/status-badge";
import { TONES, getHealthBand, getHealthTrend, getStatusMeta, listStatuses } from "@/app/lib/status";

describe("getStatusMeta", () => {
  it("maps the health states the spec calls out", () => {
    expect(getStatusMeta("projectHealth", "ON_TRACK")).toMatchObject({ tone: "positive" });
    expect(getStatusMeta("projectHealth", "AT_RISK")).toMatchObject({ tone: "caution" });
    expect(getStatusMeta("projectHealth", "DELAYED")).toMatchObject({ tone: "critical" });
  });

  it("maps the approval states the spec calls out", () => {
    expect(getStatusMeta("approvalStatus", "APPROVED")).toMatchObject({ tone: "positive" });
    expect(getStatusMeta("approvalStatus", "PENDING")).toMatchObject({ tone: "caution" });
    expect(getStatusMeta("approvalStatus", "REJECTED")).toMatchObject({ tone: "critical" });
  });

  it("only ever uses tones that exist as design tokens", () => {
    const kinds = [
      "projectHealth",
      "projectStatus",
      "companyStatus",
      "milestoneStatus",
      "taskStatus",
      "changeRequestStatus",
      "approvalStatus",
      "touchpointStatus",
      "touchpointOutcome",
      "priority",
    ];
    for (const kind of kinds) {
      for (const status of listStatuses(kind)) {
        expect(TONES).toContain(status.tone);
        expect(status.label).toBeTruthy();
        expect(status.icon).toBeTruthy();
      }
    }
  });

  it("degrades gracefully when the API sends a status we don't know yet", () => {
    expect(getStatusMeta("changeRequestStatus", "ESCALATED")).toMatchObject({
      label: "Escalated",
      tone: "neutral",
    });
  });

  it("throws on an unknown status kind rather than rendering nonsense", () => {
    expect(() => getStatusMeta("nope", "ACTIVE")).toThrow();
  });
});

describe("getHealthBand", () => {
  it("bands scores", () => {
    expect(getHealthBand(91).tone).toBe("positive");
    expect(getHealthBand(70).tone).toBe("positive");
    expect(getHealthBand(69).tone).toBe("caution");
    expect(getHealthBand(45).tone).toBe("caution");
    expect(getHealthBand(44).tone).toBe("critical");
    expect(getHealthBand(0).tone).toBe("critical");
  });

  it("distinguishes not-scored from zero", () => {
    expect(getHealthBand(null).label).toBe("Not scored");
    expect(getHealthBand(0).label).toBe("At risk");
  });
});

describe("getHealthTrend", () => {
  it("reports direction from the last two readings", () => {
    expect(getHealthTrend([60, 64, 72])).toMatchObject({ direction: "up", delta: 8 });
    expect(getHealthTrend([72, 64])).toMatchObject({ direction: "down", delta: -8 });
  });

  it("treats a one-point wobble as flat", () => {
    expect(getHealthTrend([70, 71]).direction).toBe("flat");
  });

  it("handles too little history", () => {
    expect(getHealthTrend([])).toMatchObject({ direction: "flat", delta: 0 });
    expect(getHealthTrend([70])).toMatchObject({ direction: "flat", delta: 0 });
  });
});

describe("StatusBadge", () => {
  it("renders the label as text, so status never depends on colour alone", () => {
    render(<StatusBadge kind="projectHealth" value="AT_RISK" />);
    expect(screen.getByText("At risk")).toBeInTheDocument();
  });

  it("pairs the colour with an icon", () => {
    const { container } = render(<StatusBadge kind="approvalStatus" value="REJECTED" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
