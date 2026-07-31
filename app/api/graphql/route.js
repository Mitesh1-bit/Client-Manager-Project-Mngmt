import { readFileSync } from "node:fs";
import { join } from "node:path";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { createYoga } from "graphql-yoga";

import { readTokenClaims, isExpired, SESSION_COOKIE } from "@/app/lib/auth/token";
import { resolvers } from "@/app/lib/mocks/resolvers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const typeDefs = readFileSync(join(process.cwd(), "schema.graphql"), "utf8");

const yoga = createYoga({
  schema: makeExecutableSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  context: ({ request }) => {
    const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const cookieToken = (request.headers.get("cookie") ?? "")
      .split(";")
      .map((pair) => pair.trim().split("="))
      .find(([name]) => name === SESSION_COOKIE)?.[1];
    const claims = readTokenClaims(bearer || cookieToken);
    return { claims: isExpired(claims) ? null : claims };
  },
});

export { yoga as GET, yoga as POST, yoga as OPTIONS };
