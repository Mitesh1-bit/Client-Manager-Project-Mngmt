import { describe, expect, it } from "vitest";

import { isExpired, readTokenClaims } from "@/app/lib/auth/token";
import { signMockToken } from "@/app/lib/mocks/token";

describe("readTokenClaims", () => {
  it("reads the claims back out of a token", () => {
    const { token } = signMockToken({ sub: "usr_2", scope: "INTERNAL", email: "priya@x.co" });
    expect(readTokenClaims(token)).toMatchObject({ sub: "usr_2", scope: "INTERNAL" });
  });

  it("survives unicode in the claims", () => {
    const { token } = signMockToken({ sub: "usr_9", scope: "PORTAL", name: "Tomáš Lindqvist" });
    expect(readTokenClaims(token).name).toBe("Tomáš Lindqvist");
  });

  it("returns null for anything that isn't a three-segment token", () => {
    for (const value of [null, undefined, "", "not-a-token", "a.b"]) {
      expect(readTokenClaims(value)).toBeNull();
    }
  });

  it("returns null when the payload isn't decodable JSON", () => {
    expect(readTokenClaims("aGVhZGVy.bm90LWpzb24.sig")).toBeNull();
  });

  it("returns null when the payload has no subject", () => {
    const payload = btoa(JSON.stringify({ scope: "INTERNAL" })).replace(/=+$/, "");
    expect(readTokenClaims(`h.${payload}.sig`)).toBeNull();
  });
});

describe("isExpired", () => {
  it("treats a future expiry as live", () => {
    expect(isExpired(readTokenClaims(signMockToken({ sub: "usr_1" }).token))).toBe(false);
  });

  it("treats a past expiry as expired", () => {
    expect(isExpired(readTokenClaims(signMockToken({ sub: "usr_1" }, -60).token))).toBe(true);
  });

  it("treats a missing expiry as expired", () => {
    expect(isExpired({ sub: "usr_1" })).toBe(true);
    expect(isExpired(null)).toBe(true);
  });
});
