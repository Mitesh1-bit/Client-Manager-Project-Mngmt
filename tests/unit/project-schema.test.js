import { describe, expect, it } from "vitest";

import {
  projectSchema,
  projectToFormValues,
} from "@/app/(dashboard)/projects/project-schema";
import {
  taskSchema,
  taskToFormValues,
  toTaskInput,
} from "@/app/(dashboard)/projects/[id]/(detail)/task-schema";
import {
  milestoneSchema,
  phaseSchema,
} from "@/app/(dashboard)/projects/[id]/(detail)/milestones/plan-schema";

const validProject = {
  companyId: "cmp_1",
  name: "Patient Portal Redesign",
  description: "",
  status: "ACTIVE",
  priority: "HIGH",
  projectManagerId: "",
  startDate: "2026-04-01",
  endDate: "2026-09-01",
  budget: "184000",
  tagIds: [],
};

const issuePaths = (result) => result.error.issues.map((issue) => issue.path.join("."));

describe("projectSchema", () => {
  it("requires a client", () => {
    const result = projectSchema.safeParse({ ...validProject, companyId: "" });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("companyId");
  });

  it("rejects an end date before the start date", () => {
    const result = projectSchema.safeParse({
      ...validProject,
      startDate: "2026-09-01",
      endDate: "2026-04-01",
    });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("endDate");
  });

  it("allows a project with no dates at all", () => {
    expect(
      projectSchema.safeParse({ ...validProject, startDate: "", endDate: "" }).success,
    ).toBe(true);
  });

  it("coerces the budget to a number and nulls a blank one", () => {
    expect(projectSchema.parse(validProject).budget).toBe(184000);
    expect(projectSchema.parse({ ...validProject, budget: "" }).budget).toBeNull();
  });

  it("rejects a negative budget", () => {
    const result = projectSchema.safeParse({ ...validProject, budget: "-10" });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("budget");
  });

  it("nulls an unassigned PM rather than sending an empty string", () => {
    expect(projectSchema.parse(validProject).projectManagerId).toBeNull();
  });
});

describe("projectToFormValues", () => {
  it("defaults a new project to planning", () => {
    const values = projectToFormValues(undefined);
    expect(values).toMatchObject({ status: "PLANNING", priority: "MEDIUM", tagIds: [] });
  });

  it("flattens the nested company, PM and tags", () => {
    const values = projectToFormValues({
      name: "X",
      company: { id: "cmp_2" },
      projectManager: { id: "usr_3" },
      tags: [{ id: "tag_1" }],
      status: "ACTIVE",
      priority: "LOW",
    });
    expect(values.companyId).toBe("cmp_2");
    expect(values.projectManagerId).toBe("usr_3");
    expect(values.tagIds).toEqual(["tag_1"]);
  });
});

const validTask = {
  title: "Appointment search API integration",
  description: "",
  status: "IN_PROGRESS",
  priority: "HIGH",
  assigneeId: "",
  phaseId: "",
  milestoneId: "",
  parentTaskId: "",
  startDate: "2026-07-18",
  dueDate: "2026-08-01",
  estimatedHours: "34",
};

describe("taskSchema", () => {
  it("requires a title", () => {
    const result = taskSchema.safeParse({ ...validTask, title: "x" });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("title");
  });

  it("rejects a due date before the start date", () => {
    const result = taskSchema.safeParse({
      ...validTask,
      startDate: "2026-08-01",
      dueDate: "2026-07-18",
    });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("dueDate");
  });

  it("nulls every unset relationship instead of sending empty strings", () => {
    const parsed = taskSchema.parse(validTask);
    expect(parsed.assigneeId).toBeNull();
    expect(parsed.phaseId).toBeNull();
    expect(parsed.milestoneId).toBeNull();
    expect(parsed.parentTaskId).toBeNull();
  });

  it("coerces the estimate to a number", () => {
    expect(taskSchema.parse(validTask).estimatedHours).toBe(34);
    expect(taskSchema.parse({ ...validTask, estimatedHours: "" }).estimatedHours).toBeNull();
  });
});

describe("toTaskInput", () => {
  it("attaches the project", () => {
    expect(toTaskInput(taskSchema.parse(validTask), "prj_1").projectId).toBe("prj_1");
  });
});

describe("taskToFormValues", () => {
  it("takes the column's status when creating from a board column", () => {
    expect(taskToFormValues(undefined, { status: "REVIEW" }).status).toBe("REVIEW");
  });

  it("takes the parent's context when creating a subtask", () => {
    const values = taskToFormValues(undefined, { parentTaskId: "tsk_7", phaseId: "phs_3" });
    expect(values.parentTaskId).toBe("tsk_7");
    expect(values.phaseId).toBe("phs_3");
  });

  it("defaults to a top-level to-do", () => {
    expect(taskToFormValues(undefined)).toMatchObject({ status: "TODO", parentTaskId: "" });
  });
});

describe("phaseSchema", () => {
  it("rejects an end date before the start date", () => {
    const result = phaseSchema.safeParse({
      name: "Build",
      status: "IN_PROGRESS",
      startDate: "2026-08-01",
      dueDate: "2026-07-01",
    });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("dueDate");
  });

  it("accepts a phase with no dates yet", () => {
    expect(
      phaseSchema.safeParse({ name: "Build", status: "NOT_STARTED", startDate: "", dueDate: "" })
        .success,
    ).toBe(true);
  });
});

describe("milestoneSchema", () => {
  it("requires a phase — a milestone can't float free", () => {
    const result = milestoneSchema.safeParse({
      phaseId: "",
      title: "Production launch",
      description: "",
      dueDate: "",
      requiresClientApproval: true,
    });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("phaseId");
  });

  it("defaults client sign-off to off", () => {
    const parsed = milestoneSchema.parse({
      phaseId: "phs_1",
      title: "Production launch",
    });
    expect(parsed.requiresClientApproval).toBe(false);
  });
});
