"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";

import { FormField } from "@/app/components/domain/form-field";
import { SearchableSelect } from "@/app/components/domain/searchable-select";
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
 * Two-step assignee picker: choose a role category, then a person in that group.
 * Only `assigneeId` is stored on the form; the role dropdown is UI state.
 */
export function RoleAssigneeField({
  control,
  setValue,
  watch,
  name = "assigneeId",
  users = [],
  roleLabel = "Role",
  assigneeLabel = "Assignee",
  rolePlaceholder = "Select role",
  assigneePlaceholder = "Unassigned",
  clearAssigneeLabel = "Unassigned",
  error,
  required = false,
  allowedCategories,
  roleFieldClassName,
  assigneeFieldClassName,
}) {
  const assigneeId = watch(name);
  const categories = useMemo(
    () => getAssigneeCategoriesPresent(users, allowedCategories),
    [users, allowedCategories],
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.id === assigneeId) ?? null,
    [users, assigneeId],
  );

  const [roleCategory, setRoleCategory] = useState(() =>
    selectedUser ? getUserAssigneeCategory(selectedUser) : "",
  );

  useEffect(() => {
    if (assigneeId && selectedUser) {
      setRoleCategory(getUserAssigneeCategory(selectedUser));
      return;
    }
    if (!assigneeId) {
      setRoleCategory("");
    }
  }, [assigneeId, selectedUser]);

  const assigneeOptions = useMemo(
    () => usersInAssigneeCategory(users, roleCategory),
    [users, roleCategory],
  );
  const assigneeSelectOptions = useMemo(
    () => assigneeOptions.map((user) => ({ value: user.id, label: user.name })),
    [assigneeOptions],
  );

  function handleRoleChange(nextCategory) {
    const category = nextCategory === NONE ? "" : nextCategory;
    setRoleCategory(category);

    if (!assigneeId) return;

    const current = users.find((user) => user.id === assigneeId);
    if (!current || getUserAssigneeCategory(current) !== category) {
      setValue(name, "", { shouldDirty: true, shouldValidate: true });
    }
  }

  return (
    <>
      <FormField label={roleLabel} className={roleFieldClassName}>
        {(field) => (
          <Select
            value={roleCategory || NONE}
            onValueChange={handleRoleChange}
            disabled={categories.length === 0}
          >
            <SelectTrigger {...field} className="h-10 w-full">
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
        )}
      </FormField>

      <FormField
        label={assigneeLabel}
        error={error}
        required={required}
        className={assigneeFieldClassName}
      >
        {(field) => (
          <Controller
            control={control}
            name={name}
            render={({ field: control_ }) => (
              <SearchableSelect
                {...field}
                options={assigneeSelectOptions}
                value={control_.value ?? ""}
                onChange={control_.onChange}
                placeholder={assigneePlaceholder}
                emptyText="No one matches."
                allowClear
                clearLabel={clearAssigneeLabel}
                disabled={!roleCategory || assigneeOptions.length === 0}
              />
            )}
          />
        )}
      </FormField>
    </>
  );
}
