/** Labels and descriptions for notification preference keys (mirrors backend catalog). */

export const NOTIFICATION_CATALOG = {
  change_requests: {
    label: "Change requests",
    description: "When a client submits or a change request needs your attention.",
  },
  task_assignments: {
    label: "Task assignments",
    description: "When you are assigned work on a project board.",
    internalOnly: true,
  },
  milestone_approvals: {
    label: "Milestone approvals",
    description: "When a milestone is ready for review or a client responds.",
  },
  retention_touchpoints: {
    label: "Retention touchpoints",
    description: "Upcoming or overdue client retention follow-ups.",
    internalOnly: true,
  },
  project_updates: {
    label: "Project updates",
    description: "Important status changes on projects you follow.",
  },
};

/** @param {string} key */
export function notificationMeta(key) {
  return (
    NOTIFICATION_CATALOG[key] ?? {
      label: key.replace(/_/g, " "),
      description: "",
    }
  );
}
