
-- DropIndex
DROP INDEX "issue_types_name_key";

-- DropIndex
DROP INDEX "plazas_name_key";

-- DropIndex
DROP INDEX "spare_parts_name_key";

-- DropIndex
DROP INDEX "technicians_name_key";

-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "otherExpenseEntryId" TEXT;

-- AlterTable
ALTER TABLE "budget_line_items" DROP COLUMN "autoSource";

-- DropEnum
DROP TYPE "BudgetAutoSource";

-- CreateTable
CREATE TABLE "other_expense_entries" (
    "id" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "other_expense_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "other_expense_entries_lineItemId_month_idx" ON "other_expense_entries"("lineItemId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_otherExpenseEntryId_kind_key" ON "attachments"("otherExpenseEntryId", "kind");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_otherExpenseEntryId_fkey" FOREIGN KEY ("otherExpenseEntryId") REFERENCES "other_expense_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "other_expense_entries" ADD CONSTRAINT "other_expense_entries_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "budget_line_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "other_expense_entries" ADD CONSTRAINT "other_expense_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "other_expense_entries" ADD CONSTRAINT "other_expense_entries_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

