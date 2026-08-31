-- AlterTable
ALTER TABLE "inspection_plan_week_entries" ADD COLUMN     "sparePartCost" DECIMAL(12,2),
ADD COLUMN     "sparePartCostCurrency" "Currency" NOT NULL DEFAULT 'TRY',
ADD COLUMN     "sparePartNote" TEXT;

-- AlterTable
ALTER TABLE "maintenance_plan_week_entries" ADD COLUMN     "sparePartCost" DECIMAL(12,2),
ADD COLUMN     "sparePartCostCurrency" "Currency" NOT NULL DEFAULT 'TRY',
ADD COLUMN     "sparePartNote" TEXT;

