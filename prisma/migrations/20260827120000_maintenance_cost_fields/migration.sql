-- AlterTable
ALTER TABLE "maintenance_plan_entries" ADD COLUMN "cost" DECIMAL(12,2),
ADD COLUMN "costCurrency" "Currency" NOT NULL DEFAULT 'TRY';

-- AlterTable
ALTER TABLE "periodic_inspections" ADD COLUMN "cost" DECIMAL(12,2),
ADD COLUMN "costCurrency" "Currency" NOT NULL DEFAULT 'TRY';
