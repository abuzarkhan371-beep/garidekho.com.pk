"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCatalogItemAction, saveCatalogItemAction, type CatalogKind } from "@/app/admin/catalog/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/providers/toast-provider";

type FieldType = "text" | "number" | "textarea" | "select" | "checkbox";

export type CatalogField = {
  name: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
};

export type CatalogRow = { id: string } & Record<string, unknown>;

const selectClass =
  "h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100";

function displayValue(row: CatalogRow, key: string, fields: CatalogField[]) {
  const value = row[key];
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "—";
  const field = fields.find((item) => item.name === key);
  if (field?.options) {
    return field.options.find((option) => option.value === String(value))?.label ?? String(value);
  }
  return String(value);
}

export function CatalogManager({
  kind,
  title,
  description,
  fields,
  columns,
  rows,
  emptyMessage = "Nothing here yet. Add the first item to get started.",
}: {
  kind: CatalogKind;
  title: string;
  description: string;
  fields: CatalogField[];
  columns: { key: string; label: string }[];
  rows: CatalogRow[];
  emptyMessage?: string;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [open, setOpen] = useState(false);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(row: CatalogRow) {
    setEditing(row);
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (editing?.id) formData.set("id", editing.id);
    startTransition(async () => {
      const result = await saveCatalogItemAction(kind, formData);
      toast(result.message, result.ok ? "success" : "error");
      if (result.ok) setOpen(false);
    });
  }

  function handleDelete(row: CatalogRow) {
    const label = String(row.label ?? row.name ?? "this item");
    if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return;
    const formData = new FormData();
    formData.set("id", row.id);
    startTransition(async () => {
      const result = await deleteCatalogItemAction(kind, formData);
      toast(result.message, result.ok ? "success" : "error");
    });
  }

  return (
    <section className="surface-card mt-6 overflow-hidden rounded-xl">
      <div className="flex flex-col gap-3 border-b border-ink-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-ink-800">
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <p className="mt-0.5 text-xs text-ink-500">{description}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}><Plus /> Add new</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? `Edit ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}</DialogTitle>
            </DialogHeader>
            <form key={editing?.id ?? "new"} onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => {
                const value = editing?.[field.name];
                if (field.type === "checkbox") {
                  return (
                    <label key={field.name} className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        name={field.name}
                        defaultChecked={Boolean(value)}
                        className="size-4 accent-link"
                      />
                      {field.label}
                    </label>
                  );
                }
                if (field.type === "textarea") {
                  return (
                    <label key={field.name} className="grid gap-1.5">
                      <span className="text-sm font-semibold">{field.label}</span>
                      <Textarea
                        name={field.name}
                        defaultValue={value == null ? "" : String(value)}
                        placeholder={field.placeholder}
                        rows={3}
                        required={field.required}
                      />
                      {field.hint && <span className="text-xs text-ink-400">{field.hint}</span>}
                    </label>
                  );
                }
                if (field.type === "select") {
                  return (
                    <label key={field.name} className="grid gap-1.5">
                      <span className="text-sm font-semibold">{field.label}</span>
                      <select
                        name={field.name}
                        defaultValue={value == null ? "" : String(value)}
                        className={selectClass}
                        required={field.required}
                      >
                        <option value="">Select…</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  );
                }
                return (
                  <label key={field.name} className="grid gap-1.5">
                    <span className="text-sm font-semibold">{field.label}</span>
                    <Input
                      name={field.name}
                      type={field.type === "number" ? "number" : "text"}
                      defaultValue={value == null ? "" : String(value)}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                    {field.hint && <span className="text-xs text-ink-400">{field.hint}</span>}
                  </label>
                );
              })}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2 className="animate-spin" /> : null}
                  {editing ? "Save changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-ink-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:bg-ink-800">
              <tr>
                {columns.map((column) => <th key={column.key} className="px-4 py-3">{column.label}</th>)}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-ink-50/60 dark:hover:bg-ink-800/40">
                  {columns.map((column, index) => (
                    <td key={column.key} className="px-4 py-3">
                      {index === 0 ? (
                        <span className="font-semibold">{displayValue(row, column.key, fields)}</span>
                      ) : typeof row[column.key] === "boolean" ? (
                        <Badge variant={row[column.key] ? "success" : "neutral"}>
                          {row[column.key] ? "Active" : "Inactive"}
                        </Badge>
                      ) : (
                        displayValue(row, column.key, fields)
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)} disabled={pending}>
                        <Pencil /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(row)}
                        disabled={pending}
                      >
                        <Trash2 /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
