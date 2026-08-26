-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('TRY', 'USD', 'EUR');

-- AlterTable
ALTER TABLE "maintenance_records" ADD COLUMN "sparePartOther" TEXT,
ADD COLUMN "sparePartCostCurrency" "Currency" NOT NULL DEFAULT 'TRY';
