export const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || "/api/graphql";

export const isRelativeEndpoint = !/^https?:\/\//i.test(GRAPHQL_URL);
