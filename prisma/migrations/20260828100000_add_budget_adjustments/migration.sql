-- CreateEnum
CREATE TYPE "BudgetAdjustmentType" AS ENUM ('OVERTIME', 'ABSENCE');

-- CreateTable
CREATE TABLE "budget_adjustments" (
    "id" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "type" "BudgetAdjustmentType" NOT NULL,
    "label" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budget_adjustments_lineItemId_month_idx" ON "budget_adjustments"("lineItemId", "month");

-- AddForeignKey
ALTER TABLE "budget_adjustments" ADD CONSTRAINT "budget_adjustments_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "budget_line_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

