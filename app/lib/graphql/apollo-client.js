import { HttpLink } from "@apollo/client";
import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/client-integration-nextjs";

import { cacheConfig } from "./cache-config";
import { GRAPHQL_URL } from "./endpoint";
import { serverFetch } from "./server-fetch";

export const { getClient, query, PreloadQuery } = registerApolloClient(
  () =>
    new ApolloClient({
      cache: new InMemoryCache(cacheConfig),
      link: new HttpLink({ uri: GRAPHQL_URL, fetch: serverFetch }),
    }),
);
