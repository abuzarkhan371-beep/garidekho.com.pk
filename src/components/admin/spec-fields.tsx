import { CAR_SPEC_FIELDS, type CarSpecs } from "@/lib/data/car-specs";
import { Input } from "@/components/ui/input";

const GROUP_LABELS: Record<string, string> = {
  body: "Body & dimensions",
  performance: "Performance",
  practicality: "Practicality",
  fuel: "Fuel",
  ev: "Electric / hybrid",
};

/** Renders every comparison spec field so admins can edit the full spec sheet. */
export function SpecFields({ defaults }: { defaults?: CarSpecs | null }) {
  const groups = Array.from(new Set(CAR_SPEC_FIELDS.map((field) => field.group)));

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">
            {GROUP_LABELS[group] ?? group}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {CAR_SPEC_FIELDS.filter((field) => field.group === group).map((field) => {
              const value = defaults?.[field.key];
              return (
                <label key={field.key} className="block">
                  <span className="mb-1 block text-xs font-semibold text-ink-600 dark:text-ink-300">
                    {field.label}{field.unit ? ` (${field.unit})` : ""}
                  </span>
                  <Input
                    name={field.key}
                    type={field.type === "number" ? "number" : "text"}
                    min={field.type === "number" ? 0 : undefined}
                    step={field.type === "number" ? "any" : undefined}
                    defaultValue={value === null || value === undefined ? "" : String(value)}
                    placeholder={field.type === "number" ? "—" : "e.g. SUV"}
                  />
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-ink-500">
        Leave a field blank if it is not applicable. Only filled fields appear in the public comparison table.
      </p>
    </div>
  );
}
