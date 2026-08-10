import {
  Archive,
  File,
  FileCode2,
  FileSpreadsheet,
  FileText,
  FileType2,
  GitBranch,
  Image as ImageIcon,
  Music,
  Presentation,
  Video,
} from "lucide-react";

import { CATEGORIES, getDocumentCategory } from "@/app/lib/documents/category";

/** @type {Record<string, typeof File>} */
const ICONS = {
  [CATEGORIES.MARKDOWN]: FileText,
  [CATEGORIES.MERMAID]: GitBranch,
  [CATEGORIES.SVG]: ImageIcon,
  [CATEGORIES.IMAGE]: ImageIcon,
  [CATEGORIES.PDF]: FileType2,
  [CATEGORIES.VIDEO]: Video,
  [CATEGORIES.AUDIO]: Music,
  [CATEGORIES.CODE]: FileCode2,
  [CATEGORIES.OFFICE]: Presentation,
  [CATEGORIES.HTML]: FileCode2,
  [CATEGORIES.CSV]: FileSpreadsheet,
  [CATEGORIES.ARCHIVE]: Archive,
  [CATEGORIES.TEXT]: FileText,
  [CATEGORIES.OTHER]: File,
};

/**
 * @param {{ document: { category?: string; filename?: string }; className?: string }} props
 */
export function DocumentTypeIcon({ document, className = "size-4.5" }) {
  const category = getDocumentCategory(document);
  const Icon = ICONS[category] || File;
  return <Icon aria-hidden="true" className={className} />;
}

/**
 * @param {{ document: { category?: string; filename?: string } }} props
 */
export function DocumentLanguageBadge({ document }) {
  const category = getDocumentCategory(document);
  const labels = {
    [CATEGORIES.MARKDOWN]: "MD",
    [CATEGORIES.MERMAID]: "MMD",
    [CATEGORIES.SVG]: "SVG",
    [CATEGORIES.CODE]: "CODE",
    [CATEGORIES.PDF]: "PDF",
    [CATEGORIES.HTML]: "HTML",
    [CATEGORIES.CSV]: "CSV",
  };
  const label = labels[category];
  if (!label) return null;
  return (
    <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}
