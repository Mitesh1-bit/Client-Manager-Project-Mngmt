import { describe, expect, it } from "vitest";

import { resolveRedirect, safeNextPath } from "@/app/lib/auth/routes";

const internal = { scope: "INTERNAL" };
const portal = { scope: "PORTAL" };

describe("resolveRedirect", () => {
  it("sends anonymous traffic to login and remembers where it was headed", () => {
    expect(resolveRedirect({ pathname: "/companies/cmp_1", session: null })).toBe(
      "/login?next=%2Fcompanies%2Fcmp_1",
    );
  });

  it("preserves the query string in the next parameter", () => {
    expect(resolveRedirect({ pathname: "/projects", search: "?status=ACTIVE", session: null })).toBe(
      "/login?next=%2Fprojects%3Fstatus%3DACTIVE",
    );
  });

  it("omits the next parameter for the dashboard root", () => {
    expect(resolveRedirect({ pathname: "/", session: null })).toBe("/login");
  });

  it("lets anonymous traffic reach the auth pages", () => {
    for (const pathname of ["/login", "/signup", "/sso"]) {
      expect(resolveRedirect({ pathname, session: null })).toBeNull();
    }
  });

  it("bounces signed-in users away from the auth pages, by scope", () => {
    expect(resolveRedirect({ pathname: "/login", session: internal })).toBe("/");
    expect(resolveRedirect({ pathname: "/login", session: portal })).toBe("/portal");
  });

  it("keeps client contacts inside the portal", () => {
    expect(resolveRedirect({ pathname: "/companies", session: portal })).toBe("/portal");
    expect(resolveRedirect({ pathname: "/", session: portal })).toBe("/portal");
    expect(resolveRedirect({ pathname: "/portal/projects", session: portal })).toBeNull();
  });

  it("keeps internal users out of the portal", () => {
    expect(resolveRedirect({ pathname: "/portal", session: internal })).toBe("/");
    expect(resolveRedirect({ pathname: "/portal/documents", session: internal })).toBe("/");
    expect(resolveRedirect({ pathname: "/companies", session: internal })).toBeNull();
  });

  it("does not treat a lookalike prefix as a portal route", () => {
    expect(resolveRedirect({ pathname: "/portalized", session: internal })).toBeNull();
  });
});

describe("safeNextPath", () => {
  it("returns the requested path when it matches the scope", () => {
    expect(safeNextPath("/companies/cmp_1", "INTERNAL")).toBe("/companies/cmp_1");
    expect(safeNextPath("/portal/projects", "PORTAL")).toBe("/portal/projects");
  });

  it("refuses off-site redirects", () => {
    expect(safeNextPath("https://evil.example.com", "INTERNAL")).toBe("/");
    expect(safeNextPath("//evil.example.com", "INTERNAL")).toBe("/");
  });

  it("refuses cross-scope redirects", () => {
    expect(safeNextPath("/portal/documents", "INTERNAL")).toBe("/");
    expect(safeNextPath("/companies", "PORTAL")).toBe("/portal");
  });

  it("refuses to bounce straight back to an auth page", () => {
    expect(safeNextPath("/login", "INTERNAL")).toBe("/");
  });

  it("falls back to the scope home when next is missing", () => {
    expect(safeNextPath(null, "PORTAL")).toBe("/portal");
  });
});
