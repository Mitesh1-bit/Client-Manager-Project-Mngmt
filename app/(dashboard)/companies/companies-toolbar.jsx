"use client";

import { ListToolbar } from "@/app/components/domain/list-toolbar";
import { listStatuses } from "@/app/lib/status";

const STATUS_OPTIONS = listStatuses("companyStatus").map((status) => ({
  value: status.value,
  label: status.label,
}));

export function CompaniesToolbar({ owners = [], tags = [] }) {
  return (
    <ListToolbar
      searchPlaceholder="Search clients…"
      searchLabel="Search clients by name or industry"
      filters={[
        { key: "status", label: "Status", options: STATUS_OPTIONS },
        {
          key: "tag",
          label: "Tag",
          options: tags.map((tag) => ({ value: tag.id, label: tag.name })),
        },
        {
          key: "owner",
          label: "Owner",
          multi: false,
          allLabel: "Anyone",
          options: owners.map((owner) => ({ value: owner.id, label: owner.name })),
        },
      ]}
    />
  );
}
