/**
 * A project's board columns, normalized once and threaded everywhere status
 * used to be a fixed 4-value enum — the board, list, gantt, calendar,
 * task-sheet, and completion math all key off this instead of a hardcoded
 * TODO/IN_PROGRESS/REVIEW/DONE list, since columns are per-project now.
 */

import { toUiStatus } from "@/app/lib/api/normalize";

const TONE_CYCLE = ["neutral", "info", "accent", "caution", "critical", "positive"];
const ICON_CYCLE = ["circle", "progress", "eye", "clock", "sparkle", "inbox"];

/** @param {Array<{ id: string, code: string, label: string, orderIndex: number, isTerminal: boolean }>} rawColumns */
export function normalizeProjectColumns(rawColumns) {
  const sorted = [...(rawColumns ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
  return sorted.map((column, index) => ({
    ...column,
    status: toUiStatus("taskStatus", column.code),
    tone: column.isTerminal ? "positive" : TONE_CYCLE[index % TONE_CYCLE.length],
    icon: column.isTerminal ? "check" : ICON_CYCLE[index % ICON_CYCLE.length],
  }));
}

/** @param {ReturnType<typeof normalizeProjectColumns>} boardColumns */
export function terminalColumnStatus(boardColumns) {
  return boardColumns?.find((column) => column.isTerminal)?.status ?? null;
}

/**
 * @param {ReturnType<typeof normalizeProjectColumns>} boardColumns
 * @param {string | null | undefined} status
 */
export function columnStatusMeta(boardColumns, status) {
  return boardColumns?.find((column) => column.status === status) ?? null;
}
