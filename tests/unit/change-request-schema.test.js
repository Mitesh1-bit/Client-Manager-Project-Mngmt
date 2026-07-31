import { describe, expect, it } from "vitest";

import { changeRequestSchema } from "@/app/(client-portal)/portal/change-requests/change-request-schema";
import { assessmentSchema, assessmentToFormValues } from "@/app/(dashboard)/change-requests/[id]/assessment-form";

const validRequest = {
  projectId: "prj_1",
  type: "SCOPE_ADDITION",
  title: "Add insurance eligibility check",
  description: "We would like patients to see coverage before confirming a booking, please.",
  priority: "MEDIUM",
  desiredDueDate: "",
};

describe("changeRequestSchema", () => {
  it("requires a project", () => {
    const result = changeRequestSchema.safeParse({ ...validRequest, projectId: "" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["projectId"]);
  });

  it("rejects a title that's too short to be useful", () => {
    const result = changeRequestSchema.safeParse({ ...validRequest, title: "Hi" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["title"]);
  });

  it("rejects a description too short to size the work from", () => {
    const result = changeRequestSchema.safeParse({ ...validRequest, description: "Add a thing" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["description"]);
  });

  it("nulls a blank desired date rather than sending an empty string", () => {
    expect(changeRequestSchema.parse(validRequest).desiredDueDate).toBeNull();
  });

  it("defaults priority to medium", () => {
    const { priority: _priority, ...rest } = validRequest;
    expect(changeRequestSchema.parse(rest).priority).toBe("MEDIUM");
  });

  it("rejects a type outside the enum", () => {
    expect(changeRequestSchema.safeParse({ ...validRequest, type: "REWRITE_EVERYTHING" }).success).toBe(
      false,
    );
  });
});

describe("assessmentSchema", () => {
  const valid = {
    impactHours: "96",
    impactCost: "14400",
    impactTimelineDays: "11",
    assessmentNotes: "Requires a new integration with the eligibility service plus caching.",
    requiresInternalApproval: true,
    requiresClientApproval: true,
  };

  it("requires assessment notes long enough to be useful to the client", () => {
    const result = assessmentSchema.safeParse({ ...valid, assessmentNotes: "Fine" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["assessmentNotes"]);
  });

  it("coerces the numeric fields, including negative ones for a scope reduction", () => {
    const parsed = assessmentSchema.parse({ ...valid, impactCost: "-9000", impactTimelineDays: "-6" });
    expect(parsed.impactCost).toBe(-9000);
    expect(parsed.impactTimelineDays).toBe(-6);
  });

  it("nulls a blank numeric field rather than coercing it to zero", () => {
    const parsed = assessmentSchema.parse({ ...valid, impactHours: "" });
    expect(parsed.impactHours).toBeNull();
  });
});

describe("assessmentToFormValues", () => {
  it("suggests internal approval once the cost crosses the threshold", () => {
    const values = assessmentToFormValues({ impactCost: 6000 }, 5000);
    expect(values.requiresInternalApproval).toBe(true);
  });

  it("does not suggest internal approval below the threshold", () => {
    const values = assessmentToFormValues({ impactCost: 200 }, 5000);
    expect(values.requiresInternalApproval).toBe(false);
  });

  it("uses the magnitude of a negative cost against the threshold", () => {
    const values = assessmentToFormValues({ impactCost: -9000 }, 5000);
    expect(values.requiresInternalApproval).toBe(true);
  });

  it("respects an explicit value on the request over the threshold guess", () => {
    const values = assessmentToFormValues({ impactCost: 100, requiresInternalApproval: true }, 5000);
    expect(values.requiresInternalApproval).toBe(true);
  });

  it("defaults client approval to true for a brand new assessment", () => {
    expect(assessmentToFormValues(undefined, 5000).requiresClientApproval).toBe(true);
  });
});
