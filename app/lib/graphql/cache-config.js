export const cacheConfig = {
  typePolicies: {
    Query: {
      fields: {
        changeRequests: { keyArgs: ["projectId", "status"] },
        companies: { keyArgs: ["filter"] },
        projects: { keyArgs: ["filter"] },
      },
    },
  },
};
