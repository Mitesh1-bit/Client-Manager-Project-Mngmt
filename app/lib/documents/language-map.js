import { extensionOf } from "./category";

/** @type {Record<string, string>} */
export const EXTENSION_TO_LANGUAGE = {
  ".js": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".c": "c",
  ".cpp": "cpp",
  ".h": "c",
  ".cs": "csharp",
  ".php": "php",
  ".rb": "ruby",
  ".sql": "sql",
  ".sh": "shell",
  ".bash": "shell",
  ".ps1": "powershell",
  ".css": "css",
  ".scss": "scss",
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "ini",
  ".xml": "xml",
  ".graphql": "graphql",
  ".gql": "graphql",
  ".html": "html",
  ".htm": "html",
  ".md": "markdown",
  ".mdx": "markdown",
  ".dockerfile": "dockerfile",
  ".makefile": "makefile",
  ".env": "ini",
  ".vue": "html",
  ".csv": "plaintext",
  ".txt": "plaintext",
  ".log": "plaintext",
};

/** @type {Record<string, string>} */
export const EXTENSION_TO_BADGE = {
  ".ts": "TS",
  ".tsx": "TSX",
  ".js": "JS",
  ".jsx": "JSX",
  ".py": "PY",
  ".go": "GO",
  ".rs": "RS",
  ".java": "JAVA",
  ".sql": "SQL",
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".md": "MD",
  ".mmd": "MMD",
  ".svg": "SVG",
  ".pdf": "PDF",
};

/**
 * @param {string} filename
 */
export function monacoLanguageForFile(filename) {
  const ext = extensionOf(filename);
  return EXTENSION_TO_LANGUAGE[ext] || "plaintext";
}

/**
 * @param {string} filename
 */
export function languageBadgeForFile(filename) {
  const ext = extensionOf(filename);
  if (EXTENSION_TO_BADGE[ext]) return EXTENSION_TO_BADGE[ext];
  if (ext && ext.length <= 5) return ext.slice(1).toUpperCase();
  return "FILE";
}

/**
 * @param {string} filename
 */
export function languageLabelForFile(filename) {
  const lang = monacoLanguageForFile(filename);
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}
