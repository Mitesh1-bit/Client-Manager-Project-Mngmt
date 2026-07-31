import { describe, expect, it } from "vitest";

import {
  allowedTransitions,
  awaitingParty,
  canAssess,
  canDecide,
  canTransition,
  isAssessed,
  isDecided,
  isOpen,
  isOverdue,
  nextAction,
  queueBuckets,
  responseDueAt,
} from "@/app/lib/change-requests";

const request = (overrides = {}) => ({
  id: "chr_x",
  status: "SUBMITTED",
  updatedAt: "2026-07-20T09:00:00Z",
  approvals: [],
  impactCost: null,
  impactTimelineDays: null,
  ...overrides,
});

describe("isOpen / isDecided", () => {
  it("treats the pre-decision statuses as open", () => {
    for (const status of ["SUBMITTED", "UNDER_REVIEW", "PENDING_IMPACT_ASSESSMENT", "PENDING_APPROVAL", "ON_HOLD"]) {
      expect(isOpen(status)).toBe(true);
      expect(isDecided(status)).toBe(false);
    }
  });

  it("treats approved, rejected and terminal statuses as decided", () => {
    for (const status of ["APPROVED", "REJECTED", "IN_PROGRESS", "IMPLEMENTED", "CLOSED"]) {
      expect(isOpen(status)).toBe(false);
      expect(isDecided(status)).toBe(true);
    }
  });
});

describe("allowedTransitions / canTransition", () => {
  it("only allows the moves the state machine defines", () => {
    expect(allowedTransitions("SUBMITTED")).toEqual(["UNDER_REVIEW", "ON_HOLD", "CLOSED"]);
    expect(canTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransition("SUBMITTED", "APPROVED")).toBe(false);
  });

  it("never allows anything out of a closed request", () => {
    expect(allowedTransitions("CLOSED")).toEqual([]);
  });

  it("lets a parked request resume into any of its earlier stages", () => {
    expect(allowedTransitions("ON_HOLD")).toEqual(
      expect.arrayContaining(["UNDER_REVIEW", "PENDING_IMPACT_ASSESSMENT", "PENDING_APPROVAL"]),
    );
  });
});

describe("awaitingParty", () => {
  it("sits with the agency while it's being reviewed or assessed", () => {
    for (const status of ["SUBMITTED", "UNDER_REVIEW", "PENDING_IMPACT_ASSESSMENT", "IN_PROGRESS"]) {
      expect(awaitingParty(request({ status }))).toBe("AGENCY");
    }
  });

  it("is nobody once decided, parked, or closed", () => {
    for (const status of ["APPROVED", "REJECTED", "ON_HOLD", "IMPLEMENTED", "CLOSED"]) {
      expect(awaitingParty(request({ status }))).toBe("NOBODY");
    }
  });

  it("stays with the agency while internal sign-off is outstanding, even if a client approval also exists", () => {
    const pending = request({
      status: "PENDING_APPROVAL",
      approvals: [
        { approverType: "INTERNAL", status: "PENDING" },
        { approverType: "CLIENT", status: "PENDING" },
      ],
    });
    expect(awaitingParty(pending)).toBe("AGENCY");
  });

  it("moves to the client once internal sign-off has landed", () => {
    const pending = request({
      status: "PENDING_APPROVAL",
      approvals: [
        { approverType: "INTERNAL", status: "APPROVED" },
        { approverType: "CLIENT", status: "PENDING" },
      ],
    });
    expect(awaitingParty(pending)).toBe("CLIENT");
  });

  it("defaults pending-approval-with-no-rows to the agency rather than nobody", () => {
    expect(awaitingParty(request({ status: "PENDING_APPROVAL", approvals: [] }))).toBe("AGENCY");
  });
});

describe("responseDueAt / isOverdue", () => {
  it("adds the SLA for the current status to when it last moved", () => {
    const due = responseDueAt(request({ status: "SUBMITTED", updatedAt: "2026-07-20T09:00:00Z" }));
    expect(due).toBe("2026-07-22T09:00:00.000Z");
  });

  it("has no due date for statuses without an SLA", () => {
    expect(responseDueAt(request({ status: "APPROVED" }))).toBeNull();
    expect(responseDueAt(request({ status: "ON_HOLD" }))).toBeNull();
  });

  it("is overdue once the SLA window has passed", () => {
    const now = new Date("2026-07-25T09:00:00Z").getTime();
    expect(isOverdue(request({ status: "SUBMITTED", updatedAt: "2026-07-20T09:00:00Z" }), now)).toBe(
      true,
    );
    expect(isOverdue(request({ status: "SUBMITTED", updatedAt: "2026-07-24T09:00:00Z" }), now)).toBe(
      false,
    );
  });

  it("is never overdue when there's no SLA to miss", () => {
    const now = new Date("2030-01-01").getTime();
    expect(isOverdue(request({ status: "ON_HOLD", updatedAt: "2020-01-01T00:00:00Z" }), now)).toBe(
      false,
    );
  });
});

describe("nextAction", () => {
  it("gives the PM an instruction and the client a status update for the same request", () => {
    const submitted = request({ status: "SUBMITTED" });
    expect(nextAction(submitted, "INTERNAL")).toMatch(/pick this up/i);
    expect(nextAction(submitted, "CLIENT")).toMatch(/we've received/i);
  });

  it("names whichever side is waiting, from the other side's point of view", () => {
    const waitingOnClient = request({
      status: "PENDING_APPROVAL",
      awaitingParty: "CLIENT",
      approvals: [{ approverType: "CLIENT", status: "PENDING" }],
    });
    expect(nextAction(waitingOnClient, "INTERNAL")).toMatch(/waiting on the client/i);
    expect(nextAction(waitingOnClient, "CLIENT")).toMatch(/your approval is needed/i);

    const waitingOnAgency = request({
      status: "PENDING_APPROVAL",
      awaitingParty: "AGENCY",
      approvals: [{ approverType: "INTERNAL", status: "PENDING" }],
    });
    expect(nextAction(waitingOnAgency, "CLIENT")).toMatch(/internal sign-off/i);
  });
});

describe("canAssess", () => {
  it("is assessable before a decision, including after being parked", () => {
    for (const status of ["SUBMITTED", "UNDER_REVIEW", "PENDING_IMPACT_ASSESSMENT", "ON_HOLD"]) {
      expect(canAssess(request({ status }))).toBe(true);
    }
  });

  it("cannot be reassessed once it is with an approver or decided", () => {
    for (const status of ["PENDING_APPROVAL", "APPROVED", "REJECTED"]) {
      expect(canAssess(request({ status }))).toBe(false);
    }
  });
});

describe("canDecide", () => {
  const pendingBoth = request({
    status: "PENDING_APPROVAL",
    approvals: [
      { approverType: "INTERNAL", status: "PENDING" },
      { approverType: "CLIENT", status: "PENDING" },
    ],
  });

  it("lets the internal approver decide even while a client row is also pending", () => {
    expect(canDecide(pendingBoth, "INTERNAL")).toBe(true);
  });

  it("blocks the client until internal sign-off is out of the way", () => {
    expect(canDecide(pendingBoth, "CLIENT")).toBe(false);
  });

  it("lets the client decide once internal has gone", () => {
    const clientOnly = request({
      status: "PENDING_APPROVAL",
      approvals: [
        { approverType: "INTERNAL", status: "APPROVED" },
        { approverType: "CLIENT", status: "PENDING" },
      ],
    });
    expect(canDecide(clientOnly, "CLIENT")).toBe(true);
  });

  it("is false outside PENDING_APPROVAL entirely", () => {
    expect(canDecide(request({ status: "UNDER_REVIEW" }), "INTERNAL")).toBe(false);
  });

  it("is false once that approver's own row has already been decided", () => {
    const decided = request({
      status: "PENDING_APPROVAL",
      approvals: [{ approverType: "CLIENT", status: "APPROVED" }],
    });
    expect(canDecide(decided, "CLIENT")).toBe(false);
  });
});

describe("isAssessed", () => {
  it("requires both cost and timeline to be set", () => {
    expect(isAssessed(request({ impactCost: 0, impactTimelineDays: 0 }))).toBe(true);
    expect(isAssessed(request({ impactCost: null, impactTimelineDays: 3 }))).toBe(false);
    expect(isAssessed(request())).toBe(false);
  });
});

describe("queueBuckets", () => {
  const now = new Date("2026-07-25T09:00:00Z").getTime();
  const requests = [
    request({ id: "a", status: "SUBMITTED", updatedAt: "2026-07-24T09:00:00Z" }), // not overdue
    request({ id: "b", status: "UNDER_REVIEW", updatedAt: "2026-07-10T09:00:00Z" }), // overdue
    request({ id: "c", status: "PENDING_APPROVAL", updatedAt: "2026-07-24T09:00:00Z" }),
    request({ id: "d", status: "APPROVED", updatedAt: "2026-07-01T09:00:00Z" }),
  ];

  it("buckets submitted-family statuses together", () => {
    const buckets = queueBuckets(requests, now);
    expect(buckets.submitted.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("buckets pending approval separately", () => {
    expect(queueBuckets(requests, now).pendingApproval.map((r) => r.id)).toEqual(["c"]);
  });

  it("buckets overdue independently of the other two, so a request can land in both", () => {
    expect(queueBuckets(requests, now).overdue.map((r) => r.id)).toEqual(["b"]);
  });
});
