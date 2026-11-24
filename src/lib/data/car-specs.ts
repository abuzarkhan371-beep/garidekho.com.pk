/**
 * Shared technical specification contract for new and used comparison cars.
 * Stored as JSON on `NewCar.specs` and `Vehicle.specs` so admins can extend the
 * catalogue without another code change for every optional field.
 */

export type CarSpecs = {
  bodyType?: string | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  groundClearanceMm?: number | null;
  transmission?: string | null;
  horsePower?: number | null;
  bootSpaceL?: number | null;
  kerbWeightKg?: number | null;
  fuelType?: string | null;
  fuelAverageKmpl?: number | null;
  batteryCapacityKwh?: number | null;
  rangeKm?: number | null;
  chargingTimeHours?: number | null;
  seatingCapacity?: number | null;
  topSpeedKmph?: number | null;
  tyreSize?: string | null;
};

export type SpecField = {
  key: keyof CarSpecs;
  label: string;
  type: "text" | "number";
  unit?: string;
  group: "body" | "performance" | "fuel" | "ev" | "practicality";
};

export const CAR_SPEC_FIELDS: SpecField[] = [
  { key: "bodyType", label: "Body Type", type: "text", group: "body" },
  { key: "lengthMm", label: "Length", type: "number", unit: "mm", group: "body" },
  { key: "widthMm", label: "Width", type: "number", unit: "mm", group: "body" },
  { key: "heightMm", label: "Height", type: "number", unit: "mm", group: "body" },
  { key: "groundClearanceMm", label: "Ground Clearance", type: "number", unit: "mm", group: "body" },
  { key: "transmission", label: "Transmission", type: "text", group: "performance" },
  { key: "horsePower", label: "Horse Power", type: "number", unit: "hp", group: "performance" },
  { key: "topSpeedKmph", label: "Top Speed", type: "number", unit: "km/h", group: "performance" },
  { key: "bootSpaceL", label: "Boot Space", type: "number", unit: "L", group: "practicality" },
  { key: "kerbWeightKg", label: "Kerb Weight", type: "number", unit: "kg", group: "practicality" },
  { key: "seatingCapacity", label: "Seating Capacity", type: "number", unit: "seats", group: "practicality" },
  { key: "tyreSize", label: "Tyre Size", type: "text", group: "practicality" },
  { key: "fuelType", label: "Fuel Type", type: "text", group: "fuel" },
  { key: "fuelAverageKmpl", label: "Fuel Average", type: "number", unit: "km/ltr", group: "fuel" },
  { key: "batteryCapacityKwh", label: "Battery Capacity", type: "number", unit: "kWh", group: "ev" },
  { key: "rangeKm", label: "Range", type: "number", unit: "km", group: "ev" },
  { key: "chargingTimeHours", label: "Charging Time", type: "number", unit: "hrs", group: "ev" },
];

export const SPEC_FIELD_MAP = new Map(CAR_SPEC_FIELDS.map((field) => [field.key, field]));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCarSpecs(value: unknown): CarSpecs {
  if (!isRecord(value)) return {};
  const result: Record<string, number | string> = {};
  for (const field of CAR_SPEC_FIELDS) {
    const raw = value[field.key];
    if (field.type === "number") {
      const numeric = typeof raw === "number"
        ? raw
        : typeof raw === "string" && raw.trim() ? Number(raw) : Number.NaN;
      if (Number.isFinite(numeric)) result[field.key] = numeric;
    } else if (typeof raw === "string" && raw.trim()) {
      result[field.key] = raw.trim();
    }
  }
  return result as CarSpecs;
}

export function formatSpecNumber(value: number | null | undefined, unit?: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const formatted = Number.isInteger(value) ? value.toLocaleString("en-PK") : String(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatDimensions(specs: CarSpecs | null | undefined) {
  if (!specs) return "—";
  const values = [specs.lengthMm, specs.widthMm, specs.heightMm];
  if (values.every((value) => value === null || value === undefined || !Number.isFinite(value))) return "—";
  return values.map((value) => formatSpecNumber(value)).join(" x ") + " mm";
}

export function specValue(specs: CarSpecs | null | undefined, key: keyof CarSpecs) {
  if (!specs) return "—";
  const field = SPEC_FIELD_MAP.get(key);
  if (!field) return "—";
  const value = specs[key];
  if (field.type === "number") return formatSpecNumber(value as number | null | undefined, field.unit);
  return typeof value === "string" && value.trim() ? value.trim() : "—";
}

export function hasSpec(specs: CarSpecs | null | undefined, key: keyof CarSpecs) {
  const value = specs?.[key];
  if (typeof value === "string") return value.trim().length > 0;
  return typeof value === "number" && Number.isFinite(value);
}
