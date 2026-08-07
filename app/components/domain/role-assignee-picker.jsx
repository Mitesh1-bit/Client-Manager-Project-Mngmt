"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  getAssigneeCategoriesPresent,
  getUserAssigneeCategory,
  usersInAssigneeCategory,
} from "@/app/lib/assignee-roles";

const NONE = "__none__";

/**
 * Standalone two-step assignee picker (no react-hook-form).
 */
export function RoleAssigneePicker({
  users = [],
  value,
  onChange,
  allowedCategories,
  roleLabel = "Role",
  assigneeLabel = "Assignee",
  rolePlaceholder = "Select role",
  assigneePlaceholder = "Unassigned",
  clearAssigneeLabel = "Unassigned",
  disabled = false,
  className,
}) {
  const categories = useMemo(
    () => getAssigneeCategoriesPresent(users, allowedCategories),
    [users, allowedCategories],
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.id === value) ?? null,
    [users, value],
  );

  const [roleCategory, setRoleCategory] = useState(() =>
    selectedUser ? getUserAssigneeCategory(selectedUser) : "",
  );

  useEffect(() => {
    if (value && selectedUser) {
      setRoleCategory(getUserAssigneeCategory(selectedUser));
      return;
    }
    if (!value) {
      setRoleCategory("");
    }
  }, [value, selectedUser]);

  const assigneeOptions = useMemo(
    () => usersInAssigneeCategory(users, roleCategory),
    [users, roleCategory],
  );

  function handleRoleChange(nextCategory) {
    const category = nextCategory === NONE ? "" : nextCategory;
    setRoleCategory(category);

    if (!value) return;

    const current = users.find((user) => user.id === value);
    if (!current || getUserAssigneeCategory(current) !== category) {
      onChange?.("");
    }
  }

  return (
    <div className={className ?? "grid gap-3 sm:grid-cols-2"}>
      <div className="space-y-1.5">
        <p className="text-caption font-medium">{roleLabel}</p>
        <Select
          value={roleCategory || NONE}
          onValueChange={handleRoleChange}
          disabled={disabled || categories.length === 0}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder={rolePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{rolePlaceholder}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <p className="text-caption font-medium">{assigneeLabel}</p>
        <Select
          value={value || NONE}
          onValueChange={(next) => onChange?.(next === NONE ? "" : next)}
          disabled={disabled || !roleCategory || assigneeOptions.length === 0}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder={assigneePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{clearAssigneeLabel}</SelectItem>
            {assigneeOptions.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
