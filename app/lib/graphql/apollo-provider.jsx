"use client";

import { from, HttpLink } from "@apollo/client";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

import { cacheConfig } from "./cache-config";
import { createGraphqlErrorLink } from "./error-link";
import { GRAPHQL_URL } from "./endpoint";

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(cacheConfig),
    link: from([
      createGraphqlErrorLink("client"),
      new HttpLink({
        uri: GRAPHQL_URL,
        credentials: "include",
        fetchOptions: { cache: "no-store" },
      }),
    ]),
  });
}

export function ApolloProvider({ children }) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
