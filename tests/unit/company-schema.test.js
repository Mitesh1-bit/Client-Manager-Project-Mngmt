import { describe, expect, it } from "vitest";

import {
  companySchema,
  companyToFormValues,
  toCompanyInput,
} from "@/app/(dashboard)/companies/company-schema";

const valid = {
  name: "Northwind Health",
  industry: "",
  website: "",
  size: "",
  timezone: "",
  status: "ACTIVE",
  accountOwnerId: "",
  tagIds: [],
  address: { line1: "", line2: "", city: "", region: "", postalCode: "", country: "" },
};

describe("companySchema", () => {
  it("requires a name of at least two characters", () => {
    const result = companySchema.safeParse({ ...valid, name: "N" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["name"]);
  });

  it("trims the name rather than sending the whitespace", () => {
    const result = companySchema.parse({ ...valid, name: "  Northwind Health  " });
    expect(result.name).toBe("Northwind Health");
  });

  it("turns empty optional fields into null, not empty strings", () => {
    const result = companySchema.parse(valid);
    expect(result.industry).toBeNull();
    expect(result.website).toBeNull();
    expect(result.accountOwnerId).toBeNull();
  });

  it("adds https:// to a bare domain", () => {
    expect(companySchema.parse({ ...valid, website: "northwind.health" }).website).toBe(
      "https://northwind.health",
    );
  });

  it("leaves an explicit protocol alone", () => {
    expect(companySchema.parse({ ...valid, website: "http://northwind.health" }).website).toBe(
      "http://northwind.health",
    );
  });

  it("rejects something that isn't a domain at all", () => {
    const result = companySchema.safeParse({ ...valid, website: "not a website" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["website"]);
  });

  it("rejects a status outside the lifecycle", () => {
    expect(companySchema.safeParse({ ...valid, status: "DELETED" }).success).toBe(false);
  });
});

describe("toCompanyInput", () => {
  it("drops an entirely empty address instead of sending a row of nulls", () => {
    const parsed = companySchema.parse(valid);
    expect(toCompanyInput(parsed).address).toBeNull();
  });

  it("keeps a partially filled address", () => {
    const parsed = companySchema.parse({
      ...valid,
      address: { ...valid.address, city: "London" },
    });
    expect(toCompanyInput(parsed).address).toMatchObject({ city: "London", line1: null });
  });
});

describe("companyToFormValues", () => {
  it("produces controlled-input defaults for a new company", () => {
    const values = companyToFormValues(undefined);
    expect(values.name).toBe("");
    expect(values.status).toBe("LEAD");
    expect(values.tagIds).toEqual([]);
    expect(values.address.city).toBe("");
  });

  it("flattens the nested owner and tag objects the query returns", () => {
    const values = companyToFormValues({
      name: "Halcyon Retail Group",
      status: "ACTIVE",
      accountOwner: { id: "usr_3" },
      tags: [{ id: "tag_1" }, { id: "tag_4" }],
      address: null,
    });
    expect(values.accountOwnerId).toBe("usr_3");
    expect(values.tagIds).toEqual(["tag_1", "tag_4"]);
    expect(values.address.line1).toBe("");
  });
});
