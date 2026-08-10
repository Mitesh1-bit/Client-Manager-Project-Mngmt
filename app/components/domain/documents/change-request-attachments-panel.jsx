"use client";

import { DocumentEmbedPanel } from "@/app/components/domain/documents/document-embed-panel";

/**
 * @param {{ attachments: object[] }} props
 */
export function ChangeRequestAttachmentsPanel({ attachments }) {
  if (!attachments?.length) return null;

  return <DocumentEmbedPanel documents={attachments} />;
}
