"use client";

import { HttpLink } from "@apollo/client";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

import { cacheConfig } from "./cache-config";
import { GRAPHQL_URL } from "./endpoint";

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(cacheConfig),
    link: new HttpLink({
      uri: GRAPHQL_URL,
      credentials: "include",
      fetchOptions: { cache: "no-store" },
    }),
  });
}

export function ApolloProvider({ children }) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
