-- Dynamic taxonomy options: enum-backed vehicle fields become admin-editable strings.
-- Existing values are cast (not dropped) so live listings keep their transmission,
-- fuel type, body type, assembly and condition data.

-- CreateEnum
CREATE TYPE "TaxonomyGroup" AS ENUM ('BODY_TYPE', 'FUEL_TYPE', 'TRANSMISSION', 'ASSEMBLY_TYPE', 'CONDITION', 'FEATURE');

-- AlterTable (preserve existing values)
ALTER TABLE "vehicle_variants"
  ALTER COLUMN "transmission" TYPE TEXT USING "transmission"::text,
  ALTER COLUMN "fuelType" TYPE TEXT USING "fuelType"::text;

ALTER TABLE "vehicles"
  ALTER COLUMN "transmission" TYPE TEXT USING "transmission"::text,
  ALTER COLUMN "fuelType" TYPE TEXT USING "fuelType"::text,
  ALTER COLUMN "bodyType" TYPE TEXT USING "bodyType"::text,
  ALTER COLUMN "assemblyType" TYPE TEXT USING "assemblyType"::text,
  ALTER COLUMN "condition" TYPE TEXT USING "condition"::text;

-- CreateTable
CREATE TABLE "taxonomy_options" (
    "id" TEXT NOT NULL,
    "group" "TaxonomyGroup" NOT NULL,
    "value" VARCHAR(64) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxonomy_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "taxonomy_options_group_isActive_sortOrder_idx" ON "taxonomy_options"("group", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_options_group_value_key" ON "taxonomy_options"("group", "value");
