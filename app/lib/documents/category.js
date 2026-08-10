/** @typedef {import('@/app/lib/graphql/generated/documents').DocumentFieldsFragment} Document */

export const CATEGORIES = {
  MARKDOWN: "markdown",
  MERMAID: "mermaid",
  SVG: "svg",
  IMAGE: "image",
  PDF: "pdf",
  VIDEO: "video",
  AUDIO: "audio",
  CODE: "code",
  OFFICE: "office",
  HTML: "html",
  CSV: "csv",
  ARCHIVE: "archive",
  TEXT: "text",
  OTHER: "other",
};

const CODE_EXTENSIONS = new Set([
  ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".py", ".go", ".rs", ".java",
  ".c", ".cpp", ".h", ".cs", ".php", ".rb", ".sql", ".sh", ".bash", ".css",
  ".scss", ".json", ".yaml", ".yml", ".toml", ".xml", ".graphql", ".gql", ".vue",
  ".env", ".dockerfile", ".makefile",
]);

/**
 * @param {string} filename
 */
export function extensionOf(filename) {
  const lower = (filename || "").toLowerCase();
  if (lower === "dockerfile" || lower.startsWith("dockerfile.")) return ".dockerfile";
  if (lower === "makefile") return ".makefile";
  if (lower.startsWith(".env")) return ".env";
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

/**
 * @param {Document | { category?: string; contentType?: string; filename?: string }} doc
 */
export function getDocumentCategory(doc) {
  if (doc.category) return doc.category;
  const ext = extensionOf(doc.filename || "");
  if ([".md", ".mdx", ".markdown"].includes(ext)) return CATEGORIES.MARKDOWN;
  if ([".mmd", ".mermaid"].includes(ext)) return CATEGORIES.MERMAID;
  if (ext === ".svg") return CATEGORIES.SVG;
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) return CATEGORIES.IMAGE;
  if (ext === ".pdf") return CATEGORIES.PDF;
  if ([".mp4", ".webm", ".mov"].includes(ext)) return CATEGORIES.VIDEO;
  if ([".mp3", ".wav", ".ogg"].includes(ext)) return CATEGORIES.AUDIO;
  if ([".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"].includes(ext)) return CATEGORIES.OFFICE;
  if ([".html", ".htm"].includes(ext)) return CATEGORIES.HTML;
  if ([".csv", ".tsv"].includes(ext)) return CATEGORIES.CSV;
  if ([".zip", ".rar", ".7z"].includes(ext)) return CATEGORIES.ARCHIVE;
  if (CODE_EXTENSIONS.has(ext)) return CATEGORIES.CODE;
  if (ext === ".txt" || ext === ".log") return CATEGORIES.TEXT;
  return CATEGORIES.OTHER;
}

/**
 * @param {Document | { category?: string; canPreview?: boolean }} doc
 */
export function canOpenPreview(doc) {
  if (typeof doc.canPreview === "boolean") return doc.canPreview;
  const cat = getDocumentCategory(doc);
  return cat !== CATEGORIES.OTHER;
}

/**
 * @param {string} category
 */
export function categoryLabel(category) {
  const labels = {
    markdown: "Markdown",
    mermaid: "Mermaid",
    svg: "SVG",
    image: "Image",
    pdf: "PDF",
    video: "Video",
    audio: "Audio",
    code: "Code",
    office: "Office",
    html: "HTML",
    csv: "CSV",
    archive: "Archive",
    text: "Text",
    other: "File",
  };
  return labels[category] || "File";
}
