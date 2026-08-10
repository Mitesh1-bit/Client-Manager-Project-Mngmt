import { CalendarClock, Mail, Phone, SquareCheckBig, Users } from "lucide-react";

/**
 * Presentation for `SequenceChannel` — shared by the touchpoint timeline, the
 * sequence builder's step editor, and the manual logging form, so a "Call" is
 * drawn identically everywhere it appears rather than three slightly
 * different phone icons.
 */
export const CHANNEL_ICONS = {
  EMAIL: Mail,
  CALL: Phone,
  MEETING: Users,
  INTERNAL_TASK: SquareCheckBig,
};

export const CHANNEL_LABELS = {
  EMAIL: "Email",
  CALL: "Call",
  MEETING: "Meeting",
  INTERNAL_TASK: "Internal task",
};

export const CHANNEL_OPTIONS = Object.entries(CHANNEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/** Post-project retention — follow-up calls and emails only. */
export const RETENTION_CHANNEL_OPTIONS = CHANNEL_OPTIONS.filter(({ value }) =>
  ["EMAIL", "CALL"].includes(value),
);

/** @deprecated Use RETENTION_CHANNEL_OPTIONS */
export const SEQUENCE_CHANNEL_OPTIONS = RETENTION_CHANNEL_OPTIONS;

export function channelIcon(channel) {
  return CHANNEL_ICONS[channel] ?? CalendarClock;
}

export function channelLabel(channel) {
  return CHANNEL_LABELS[channel] ?? channel;
}
