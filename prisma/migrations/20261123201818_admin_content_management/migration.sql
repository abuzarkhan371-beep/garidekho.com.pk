-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "featuredRank" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "specs" JSONB;

-- CreateTable
CREATE TABLE "new_cars" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "tab" TEXT NOT NULL DEFAULT 'popular',
    "imageUrl" TEXT,
    "price" INTEGER NOT NULL,
    "summary" TEXT,
    "specs" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "new_cars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "new_cars_slug_key" ON "new_cars"("slug");

-- CreateIndex
CREATE INDEX "new_cars_isActive_tab_sortOrder_idx" ON "new_cars"("isActive", "tab", "sortOrder");
