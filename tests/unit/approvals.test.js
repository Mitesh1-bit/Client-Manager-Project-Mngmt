import { describe, expect, it } from "vitest";

import {
  APPROVAL_STATE,
  approvalNextAction,
  buildApprovalQueue,
  countAwaitingViewer,
  getMilestoneApprovalState,
} from "@/app/lib/approvals";

const VIEWER = "Marcus Bell";

const approval = (overrides = {}) => ({
  id: "apr_x",
  approverType: "CLIENT",
  approverName: VIEWER,
  status: "PENDING",
  comment: null,
  decidedAt: null,
  createdAt: "2026-07-20T09:00:00Z",
  ...overrides,
});

const milestone = (overrides = {}) => ({
  id: "mst_x",
  title: "Booking flow ready for review",
  dueDate: "2026-08-02",
  requiresClientApproval: true,
  approvals: [],
  ...overrides,
});

describe("getMilestoneApprovalState", () => {
  it("says nothing is needed when the milestone never required sign-off", () => {
    const result = getMilestoneApprovalState(
      milestone({ requiresClientApproval: false }),
      VIEWER,
    );
    expect(result.state).toBe(APPROVAL_STATE.NOT_REQUIRED);
    expect(result.actionable).toBe(false);
  });

  it("says not ready when sign-off is needed but nothing has been sent", () => {
    const result = getMilestoneApprovalState(milestone(), VIEWER);
    expect(result.state).toBe(APPROVAL_STATE.NOT_READY);
    expect(result.actionable).toBe(false);
  });

  it("is the viewer's turn when their own approval is pending", () => {
    const result = getMilestoneApprovalState(
      milestone({ approvals: [approval()] }),
      VIEWER,
    );
    expect(result.state).toBe(APPROVAL_STATE.YOUR_TURN);
    expect(result.actionable).toBe(true);
    expect(result.yourApproval.id).toBe("apr_x");
  });

  it("is a colleague's turn when the pending approval belongs to someone else", () => {
    const result = getMilestoneApprovalState(
      milestone({ approvals: [approval({ approverName: "Ruth Kaplan" })] }),
      VIEWER,
    );
    expect(result.state).toBe(APPROVAL_STATE.WAITING_OTHER);
    expect(result.actionable).toBe(false);
    expect(result.waitingOn).toBe("Ruth Kaplan");
    // The critical guarantee: never offer a button for someone else's decision.
    expect(result.yourApproval).toBeNull();
  });

  it("waits on internal review before asking the client, even if their row exists", () => {
    const result = getMilestoneApprovalState(
      milestone({
        approvals: [
          approval({ id: "apr_int", approverType: "INTERNAL", approverName: "Priya Raman" }),
          approval({ id: "apr_client" }),
        ],
      }),
      VIEWER,
    );
    expect(result.state).toBe(APPROVAL_STATE.WAITING_INTERNAL);
    expect(result.actionable).toBe(false);
    expect(result.waitingOn).toBe("Priya Raman");
  });

  it("becomes the viewer's turn once internal review has passed", () => {
    const result = getMilestoneApprovalState(
      milestone({
        approvals: [
          approval({
            id: "apr_int",
            approverType: "INTERNAL",
            approverName: "Priya Raman",
            status: "APPROVED",
            decidedAt: "2026-07-21T09:00:00Z",
          }),
          approval({ id: "apr_client" }),
        ],
      }),
      VIEWER,
    );
    expect(result.state).toBe(APPROVAL_STATE.YOUR_TURN);
  });

  it("reports approved once every client approver has signed", () => {
    const result = getMilestoneApprovalState(
      milestone({
        approvals: [
          approval({ id: "a", status: "APPROVED", decidedAt: "2026-07-22T09:00:00Z" }),
          approval({
            id: "b",
            approverName: "Ruth Kaplan",
            status: "APPROVED",
            decidedAt: "2026-07-23T09:00:00Z",
          }),
        ],
      }),
      VIEWER,
    );
    expect(result.state).toBe(APPROVAL_STATE.APPROVED);
    expect(result.decision.id).toBe("b");
  });

  it("still waits when one of two client approvers has not signed", () => {
    const result = getMilestoneApprovalState(
      milestone({
        approvals: [
          approval({ id: "a", status: "APPROVED", decidedAt: "2026-07-22T09:00:00Z" }),
          approval({ id: "b", approverName: "Ruth Kaplan", status: "PENDING" }),
        ],
      }),
      VIEWER,
    );
    expect(result.state).toBe(APPROVAL_STATE.WAITING_OTHER);
  });

  it("reports changes requested and keeps the reason", () => {
    const result = getMilestoneApprovalState(
      milestone({
        approvals: [
          approval({
            status: "REJECTED",
            comment: "Wording needs to match our clinical tone.",
            decidedAt: "2026-07-24T09:00:00Z",
          }),
        ],
      }),
      VIEWER,
    );
    expect(result.state).toBe(APPROVAL_STATE.CHANGES_REQUESTED);
    expect(result.decision.comment).toBe("Wording needs to match our clinical tone.");
  });

  it("prefers a fresh pending round over an older rejection", () => {
    const result = getMilestoneApprovalState(
      milestone({
        approvals: [
          approval({ id: "old", status: "REJECTED", decidedAt: "2026-07-10T09:00:00Z" }),
          approval({ id: "new", status: "PENDING", createdAt: "2026-07-25T09:00:00Z" }),
        ],
      }),
      VIEWER,
    );
    expect(result.state).toBe(APPROVAL_STATE.YOUR_TURN);
  });

  it("does not claim an approval for an anonymous viewer", () => {
    const result = getMilestoneApprovalState(milestone({ approvals: [approval()] }), null);
    expect(result.state).toBe(APPROVAL_STATE.WAITING_OTHER);
    expect(result.actionable).toBe(false);
  });
});

describe("approvalNextAction", () => {
  it("names who the ball is with", () => {
    const yours = getMilestoneApprovalState(milestone({ approvals: [approval()] }), VIEWER);
    expect(approvalNextAction(yours)).toMatch(/your approval is needed/i);

    const theirs = getMilestoneApprovalState(
      milestone({ approvals: [approval({ approverName: "Ruth Kaplan" })] }),
      VIEWER,
    );
    expect(approvalNextAction(theirs)).toBe("Waiting on Ruth Kaplan to review.");
  });

  it("names the milestone when nothing has been sent yet", () => {
    const notReady = getMilestoneApprovalState(milestone(), VIEWER);
    expect(approvalNextAction(notReady, { milestoneTitle: "Production launch" })).toContain(
      "Production launch",
    );
  });
});

describe("buildApprovalQueue", () => {
  const projects = [
    {
      id: "prj_1",
      name: "Patient Portal Redesign",
      milestones: [
        milestone({ id: "m_yours", dueDate: "2026-09-01", approvals: [approval()] }),
        milestone({ id: "m_none", requiresClientApproval: false }),
        milestone({ id: "m_unsent" }),
        milestone({
          id: "m_done",
          dueDate: "2026-06-01",
          approvals: [approval({ status: "APPROVED", decidedAt: "2026-06-02T09:00:00Z" })],
        }),
      ],
    },
    {
      id: "prj_2",
      name: "Clinician Data Warehouse",
      milestones: [
        milestone({
          id: "m_theirs",
          dueDate: "2026-08-15",
          approvals: [approval({ approverName: "Ruth Kaplan" })],
        }),
      ],
    },
  ];

  it("drops milestones that need nothing and ones not yet sent", () => {
    const queue = buildApprovalQueue(projects, VIEWER);
    expect(queue.map((item) => item.milestone.id)).not.toContain("m_none");
    expect(queue.map((item) => item.milestone.id)).not.toContain("m_unsent");
  });

  it("puts what needs the viewer at the top", () => {
    const queue = buildApprovalQueue(projects, VIEWER);
    expect(queue[0].milestone.id).toBe("m_yours");
    expect(queue.at(-1).milestone.id).toBe("m_done");
  });

  it("carries the project through for context", () => {
    const queue = buildApprovalQueue(projects, VIEWER);
    expect(queue[0].project).toEqual({ id: "prj_1", name: "Patient Portal Redesign" });
  });

  it("counts only what is actionable by this viewer", () => {
    expect(countAwaitingViewer(buildApprovalQueue(projects, VIEWER))).toBe(1);
    expect(countAwaitingViewer(buildApprovalQueue(projects, "Ruth Kaplan"))).toBe(1);
    expect(countAwaitingViewer(buildApprovalQueue(projects, "Nobody At All"))).toBe(0);
  });
});
