import { describe, expect, it } from "vitest";

import {
  contactFormSchema,
  contactToFormValues,
  toContactInput,
} from "@/app/(dashboard)/companies/[id]/(detail)/contacts/contact-schema";

const valid = {
  firstName: "Marcus",
  lastName: "Bell",
  email: "marcus.bell@northwind.health",
  phone: "",
  title: "",
  department: "",
  preferredChannel: "",
  bestTimeToContact: "",
  timezone: "",
  linkedinUrl: "",
  isPrimary: false,
  portalAccessEnabled: false,
  doNotContact: false,
  status: "ACTIVE",
};

function issuePaths(result) {
  return result.error.issues.map((issue) => issue.path.join("."));
}

describe("contactFormSchema", () => {
  it("requires a name and a well-formed email", () => {
    const result = contactFormSchema.safeParse({ ...valid, firstName: "", email: "marcus@" });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(expect.arrayContaining(["firstName", "email"]));
  });

  it("nulls out blank optional fields", () => {
    const parsed = contactFormSchema.parse(valid);
    expect(parsed.phone).toBeNull();
    expect(parsed.preferredChannel).toBeNull();
    expect(parsed.linkedinUrl).toBeNull();
  });

  it("normalises a bare LinkedIn URL", () => {
    const parsed = contactFormSchema.parse({ ...valid, linkedinUrl: "linkedin.com/in/marcusbell" });
    expect(parsed.linkedinUrl).toBe("https://linkedin.com/in/marcusbell");
  });

  it("rejects a LinkedIn value that isn't a URL", () => {
    const result = contactFormSchema.safeParse({ ...valid, linkedinUrl: "marcusbell" });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("linkedinUrl");
  });

  it("won't let a do-not-contact person be the primary contact", () => {
    const result = contactFormSchema.safeParse({ ...valid, doNotContact: true, isPrimary: true });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("isPrimary");
  });

  it("won't grant portal access to a do-not-contact person", () => {
    const result = contactFormSchema.safeParse({
      ...valid,
      doNotContact: true,
      portalAccessEnabled: true,
    });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("portalAccessEnabled");
  });

  it("won't let an archived contact be the primary contact", () => {
    const result = contactFormSchema.safeParse({ ...valid, status: "INACTIVE", isPrimary: true });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("isPrimary");
  });

  it("allows do-not-contact on its own", () => {
    expect(contactFormSchema.safeParse({ ...valid, doNotContact: true }).success).toBe(true);
  });
});

describe("toContactInput", () => {
  it("attaches the company the contact belongs to", () => {
    const parsed = contactFormSchema.parse(valid);
    expect(toContactInput(parsed, "cmp_1").companyId).toBe("cmp_1");
  });
});

describe("contactToFormValues", () => {
  it("defaults every field for a new contact", () => {
    const values = contactToFormValues(undefined);
    expect(values).toMatchObject({
      firstName: "",
      status: "ACTIVE",
      isPrimary: false,
      doNotContact: false,
      portalAccessEnabled: false,
    });
  });

  it("replaces nulls from the API with empty strings so inputs stay controlled", () => {
    const values = contactToFormValues({
      firstName: "Marcus",
      lastName: "Bell",
      email: "marcus.bell@northwind.health",
      phone: null,
      title: null,
      preferredChannel: null,
      isPrimary: true,
      portalAccessEnabled: true,
      doNotContact: false,
      status: "ACTIVE",
    });
    expect(values.phone).toBe("");
    expect(values.preferredChannel).toBe("");
    expect(values.isPrimary).toBe(true);
  });
});
