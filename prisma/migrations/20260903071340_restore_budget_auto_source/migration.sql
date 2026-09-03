-- CreateEnum
CREATE TYPE "BudgetAutoSource" AS ENUM ('MAINTENANCE_PLAN', 'INSPECTION', 'FAULT_RECORDS');

-- AlterTable
ALTER TABLE "budget_line_items" ADD COLUMN     "autoSource" "BudgetAutoSource";
