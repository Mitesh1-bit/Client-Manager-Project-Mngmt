"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { fetchArchiveEntries } from "@/app/lib/documents/fetch";
import { formatFileSize } from "@/app/lib/documents/format";

/**
 * @param {{ documentId: string }} props
 */
export function ArchivePreview({ documentId }) {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchArchiveEntries(documentId)
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center gap-2 text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Reading archive…
      </div>
    );
  }

  if (error) {
    return <p className="p-6 text-sm text-critical">{error}</p>;
  }

  return (
    <div className="overflow-auto p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-caption text-muted-foreground">
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Size</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.name} className="border-b last:border-0">
              <td className="px-3 py-2 font-mono text-xs">{entry.name}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatFileSize(entry.sizeBytes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
