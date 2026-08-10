/**
 * Approval state derivation.
 *
 * The portal's whole job on this flow is answering one question without
 * ambiguity: *is this waiting on me, or on the agency?* That answer is
 * derived here rather than in a component, so it can be unit tested and so
 * the inbox, the project page and the panel can never disagree.
 *
 * There is no per-contact assignment on a client approval — the backend
 * reports every one with the same generic `approverName` ("Client contact",
 * see MilestoneApprovalType.from_model), not a specific person. So once
 * internal review has cleared, any portal contact at the company is treated
 * as able to act — `WAITING_OTHER` is kept as a state for possible future use
 * if per-contact assignment is ever added, but is never produced today.
 */

export const APPROVAL_STATE = {
  /** The milestone was never marked as needing client sign-off. */
  NOT_REQUIRED: "NOT_REQUIRED",
  /** Needs sign-off, but the team hasn't sent it over yet. */
  NOT_READY: "NOT_READY",
  /** Sent, but the agency's own review hasn't finished. Not the client's turn. */
  WAITING_INTERNAL: "WAITING_INTERNAL",
  /** Waiting on the person looking at the screen. */
  YOUR_TURN: "YOUR_TURN",
  /** Waiting on a different contact at the same company. */
  WAITING_OTHER: "WAITING_OTHER",
  APPROVED: "APPROVED",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
};

const PRESENTATION = {
  [APPROVAL_STATE.NOT_REQUIRED]: { label: "No sign-off needed", tone: "neutral" },
  [APPROVAL_STATE.NOT_READY]: { label: "Not ready for review", tone: "neutral" },
  [APPROVAL_STATE.WAITING_INTERNAL]: { label: "In internal review", tone: "info" },
  [APPROVAL_STATE.YOUR_TURN]: { label: "Needs your approval", tone: "caution" },
  [APPROVAL_STATE.WAITING_OTHER]: { label: "Waiting on a colleague", tone: "info" },
  [APPROVAL_STATE.APPROVED]: { label: "Approved", tone: "positive" },
  [APPROVAL_STATE.CHANGES_REQUESTED]: { label: "Changes requested", tone: "critical" },
};

const byNewest = (a, b) => new Date(b.decidedAt ?? b.createdAt) - new Date(a.decidedAt ?? a.createdAt);

/**
 * @param {{ requiresClientApproval: boolean, approvals: Array<object> }} milestone
 * @param {string | null | undefined} viewerName the signed-in contact's full name
 */
export function getMilestoneApprovalState(milestone, viewerName) {
  const approvals = milestone.approvals ?? [];
  const client = approvals.filter((approval) => approval.approverType === "CLIENT");
  const internal = approvals.filter((approval) => approval.approverType === "INTERNAL");

  const decided = [...client, ...internal].filter((approval) => approval.status !== "PENDING");
  const base = { approvals, client, internal, decided: decided.sort(byNewest) };

  if (!milestone.requiresClientApproval) {
    return present(APPROVAL_STATE.NOT_REQUIRED, { ...base, waitingOn: null, yourApproval: null });
  }

  if (client.length === 0) {
    return present(APPROVAL_STATE.NOT_READY, { ...base, waitingOn: null, yourApproval: null });
  }

  const pending = client.find((approval) => approval.status === "PENDING");

  if (pending) {
    // The agency signs off internally first; until that lands the client is
    // not being asked for anything, whatever their own row says.
    const internalPending = internal.find((approval) => approval.status === "PENDING");
    if (internalPending) {
      return present(APPROVAL_STATE.WAITING_INTERNAL, {
        ...base,
        waitingOn: internalPending.approverName ?? "the delivery team",
        yourApproval: null,
      });
    }

    // Client approvals aren't assigned to one named contact — the backend
    // reports a generic "Client contact" placeholder for all of them (see
    // MilestoneApprovalType.from_model), which can never equal a real
    // viewer's name. Any portal contact at the company (already scoped by
    // the portalProjects query) is entitled to act on a pending one.
    return present(APPROVAL_STATE.YOUR_TURN, {
      ...base,
      waitingOn: viewerName ?? "your team",
      yourApproval: pending,
    });
  }

  const rejected = client.filter((approval) => approval.status === "REJECTED").sort(byNewest)[0];
  if (rejected) {
    return present(APPROVAL_STATE.CHANGES_REQUESTED, {
      ...base,
      waitingOn: null,
      yourApproval: null,
      decision: rejected,
    });
  }

  return present(APPROVAL_STATE.APPROVED, {
    ...base,
    waitingOn: null,
    yourApproval: null,
    decision: client.filter((approval) => approval.status === "APPROVED").sort(byNewest)[0],
  });
}

function present(state, extra) {
  return { state, ...PRESENTATION[state], ...extra, actionable: state === APPROVAL_STATE.YOUR_TURN };
}

/**
 * The single sentence the portal leads with. Written for the client reading it,
 * so it always names who the ball is with.
 */
export function approvalNextAction(approvalState, { milestoneTitle } = {}) {
  switch (approvalState.state) {
    case APPROVAL_STATE.YOUR_TURN:
      return "Your approval is needed before we can close this off.";
    case APPROVAL_STATE.WAITING_OTHER:
      return `Waiting on ${approvalState.waitingOn} to review.`;
    case APPROVAL_STATE.WAITING_INTERNAL:
      return "We're finishing our own review before sending this to you.";
    case APPROVAL_STATE.CHANGES_REQUESTED:
      return "We're working through the changes you asked for.";
    case APPROVAL_STATE.APPROVED:
      return "Signed off — nothing else needed from you.";
    case APPROVAL_STATE.NOT_READY:
      return milestoneTitle
        ? `We'll let you know when “${milestoneTitle}” is ready for review.`
        : "We'll let you know when this is ready for review.";
    default:
      return "This one doesn't need your sign-off.";
  }
}

/**
 * Flattens a client's projects into one approval queue, newest request first.
 * Items needing the viewer act sort to the top — the inbox exists to answer
 * "what is waiting on me".
 *
 * @param {Array<{ id: string, name: string, milestones: Array<object> }>} projects
 * @param {string | null | undefined} viewerName
 */
export function buildApprovalQueue(projects, viewerName) {
  const items = [];

  for (const project of projects) {
    for (const milestone of project.milestones ?? []) {
      const approvalState = getMilestoneApprovalState(milestone, viewerName);
      if (approvalState.state === APPROVAL_STATE.NOT_REQUIRED) continue;
      if (approvalState.state === APPROVAL_STATE.NOT_READY) continue;

      items.push({
        key: `milestone-${milestone.id}`,
        kind: "milestone",
        milestone,
        project: { id: project.id, name: project.name },
        approvalState,
      });
    }
  }

  const rank = {
    [APPROVAL_STATE.YOUR_TURN]: 0,
    [APPROVAL_STATE.WAITING_OTHER]: 1,
    [APPROVAL_STATE.WAITING_INTERNAL]: 2,
    [APPROVAL_STATE.CHANGES_REQUESTED]: 3,
    [APPROVAL_STATE.APPROVED]: 4,
  };

  return items.sort((a, b) => {
    const byRank = rank[a.approvalState.state] - rank[b.approvalState.state];
    if (byRank !== 0) return byRank;
    return new Date(a.milestone.dueDate ?? 0) - new Date(b.milestone.dueDate ?? 0);
  });
}

/** How many items are actually waiting on this person — the nav badge. */
export function countAwaitingViewer(queue) {
  return queue.filter((item) => item.approvalState.actionable).length;
}
