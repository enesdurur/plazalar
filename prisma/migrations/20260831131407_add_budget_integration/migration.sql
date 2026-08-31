-- CreateEnum
CREATE TYPE "BudgetAutoSource" AS ENUM ('MAINTENANCE_PLAN', 'INSPECTION', 'FAULT_RECORDS');

-- AlterTable
ALTER TABLE "budget_line_items" ADD COLUMN     "autoSource" "BudgetAutoSource";

-- AlterTable
ALTER TABLE "inspection_plan_week_entries" ADD COLUMN     "costExchangeRate" DECIMAL(10,4),
ADD COLUMN     "sparePartExchangeRate" DECIMAL(10,4);

-- AlterTable
ALTER TABLE "maintenance_plan_week_entries" ADD COLUMN     "costExchangeRate" DECIMAL(10,4),
ADD COLUMN     "sparePartExchangeRate" DECIMAL(10,4);

-- AlterTable
ALTER TABLE "maintenance_records" ADD COLUMN     "sparePartExchangeRate" DECIMAL(10,4);
