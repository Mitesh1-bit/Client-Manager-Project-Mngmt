const { createRequire } = require("node:module");

const localRequire = createRequire(__filename);

/**
 * Points at the local schema stub while the backend is in flight. Swap `schema`
 * to the live endpoint (e.g. http://localhost:8000/graphql) once it exists —
 * nothing else in this config changes.
 *
 * @type {import('@graphql-codegen/cli').CodegenConfig}
 */
module.exports = {
  schema: process.env.GRAPHQL_SCHEMA || "./schema.backend.graphql",
  documents: ["app/**/*.graphql"],
  ignoreNoDocuments: false,
  pluginLoader: async (name) => {
    if (name === "js-documents") return localRequire("./codegen/js-documents.cjs");
    return import(name);
  },
  generates: {
    "app/lib/graphql/generated/documents.js": {
      plugins: ["js-documents"],
    },
  },
};
