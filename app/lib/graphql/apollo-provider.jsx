"use client";

import { from, HttpLink } from "@apollo/client";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

import { cacheConfig } from "./cache-config";
import { clientFetch } from "./client-fetch";
import { createGraphqlErrorLink } from "./error-link";
import { GRAPHQL_URL } from "./endpoint";

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(cacheConfig),
    link: from([
      createGraphqlErrorLink("client"),
      new HttpLink({
        uri: GRAPHQL_URL,
        fetch: clientFetch,
      }),
    ]),
  });
}

export function ApolloProvider({ children }) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
