-- AlterEnum
ALTER TYPE "BudgetAutoSource" ADD VALUE 'SPARE_PARTS';

-- AlterTable
ALTER TABLE "maintenance_records" ADD COLUMN     "budgetMonth" INTEGER;
