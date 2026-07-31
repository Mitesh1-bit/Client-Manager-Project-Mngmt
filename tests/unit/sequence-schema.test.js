import { describe, expect, it } from "vitest";

import {
  sequenceSchema,
  sequenceToFormValues,
  toSequenceInput,
} from "@/app/(dashboard)/retention/sequences/sequence-schema";

const step = (overrides = {}) => ({
  clientId: "step_1",
  name: "Welcome email",
  channel: "EMAIL",
  offsetDays: 0,
  assigneeRole: "",
  templateId: "",
  ...overrides,
});

const validSequence = {
  name: "Client Onboarding",
  description: "",
  triggerType: "MANUAL",
  isActive: true,
  steps: [step()],
};

function issuePaths(result) {
  return result.error.issues.map((issue) => issue.path.join("."));
}

describe("sequenceSchema", () => {
  it("requires a name of at least 2 characters", () => {
    const result = sequenceSchema.safeParse({ ...validSequence, name: "X" });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("name");
  });

  it("requires at least one step", () => {
    const result = sequenceSchema.safeParse({ ...validSequence, steps: [] });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("steps");
  });

  it("nulls a blank description rather than sending an empty string", () => {
    expect(sequenceSchema.parse(validSequence).description).toBeNull();
  });

  it("rejects a step with no name", () => {
    const result = sequenceSchema.safeParse({
      ...validSequence,
      steps: [step({ name: "" })],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative offset", () => {
    const result = sequenceSchema.safeParse({
      ...validSequence,
      steps: [step({ offsetDays: -1 })],
    });
    expect(result.success).toBe(false);
  });

  it("coerces a string offset to a number", () => {
    const parsed = sequenceSchema.parse({
      ...validSequence,
      steps: [step({ offsetDays: "5" })],
    });
    expect(parsed.steps[0].offsetDays).toBe(5);
  });

  it("accepts steps whose days are non-decreasing in order", () => {
    const result = sequenceSchema.safeParse({
      ...validSequence,
      steps: [
        step({ clientId: "a", offsetDays: 0 }),
        step({ clientId: "b", offsetDays: 5 }),
        step({ clientId: "c", offsetDays: 5 }),
        step({ clientId: "d", offsetDays: 14 }),
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a step that fires before the one ahead of it", () => {
    // This is exactly what dragging a step to the wrong place produces —
    // the mock resolver enforces the same rule server-side (toSequenceSteps).
    const result = sequenceSchema.safeParse({
      ...validSequence,
      steps: [
        step({ clientId: "a", offsetDays: 10 }),
        step({ clientId: "b", offsetDays: 5 }),
      ],
    });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("steps");
  });

  it("nulls an unassigned role and template rather than sending empty strings", () => {
    const parsed = sequenceSchema.parse(validSequence);
    expect(parsed.steps[0].assigneeRole).toBeNull();
    expect(parsed.steps[0].templateId).toBeNull();
  });
});

describe("toSequenceInput", () => {
  it("strips the client-only clientId before sending to the server", () => {
    const parsed = sequenceSchema.parse(validSequence);
    const input = toSequenceInput(parsed);
    expect(input.steps[0]).not.toHaveProperty("clientId");
    expect(input.steps[0].name).toBe("Welcome email");
  });
});

describe("sequenceToFormValues", () => {
  it("gives a new sequence one empty step to start from", () => {
    const values = sequenceToFormValues(undefined);
    expect(values.steps).toHaveLength(1);
    expect(values.triggerType).toBe("MANUAL");
    expect(values.isActive).toBe(true);
  });

  it("sorts existing steps by stepOrder regardless of array order", () => {
    const values = sequenceToFormValues({
      name: "QBR",
      triggerType: "MANUAL",
      isActive: true,
      steps: [
        { id: "stp_2", stepOrder: 1, name: "Second", channel: "CALL", offsetDays: 5 },
        { id: "stp_1", stepOrder: 0, name: "First", channel: "EMAIL", offsetDays: 0 },
      ],
    });
    expect(values.steps.map((s) => s.name)).toEqual(["First", "Second"]);
  });

  it("gives each step form row a unique clientId for dnd-kit and RHF identity", () => {
    const values = sequenceToFormValues({
      name: "QBR",
      triggerType: "MANUAL",
      isActive: true,
      steps: [
        { id: "stp_1", stepOrder: 0, name: "A", channel: "EMAIL", offsetDays: 0 },
        { id: "stp_2", stepOrder: 1, name: "B", channel: "EMAIL", offsetDays: 1 },
      ],
    });
    const ids = values.steps.map((s) => s.clientId);
    expect(new Set(ids).size).toBe(2);
  });
});
