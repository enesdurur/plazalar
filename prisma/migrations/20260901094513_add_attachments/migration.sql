-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('INVOICE', 'MAINTENANCE_FORM');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TEKNIKER';

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planWeekEntryId" TEXT,
    "inspectionWeekEntryId" TEXT,
    "maintenanceRecordId" TEXT,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attachments_planWeekEntryId_kind_key" ON "attachments"("planWeekEntryId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_inspectionWeekEntryId_kind_key" ON "attachments"("inspectionWeekEntryId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_maintenanceRecordId_kind_key" ON "attachments"("maintenanceRecordId", "kind");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_planWeekEntryId_fkey" FOREIGN KEY ("planWeekEntryId") REFERENCES "maintenance_plan_week_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_inspectionWeekEntryId_fkey" FOREIGN KEY ("inspectionWeekEntryId") REFERENCES "inspection_plan_week_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_maintenanceRecordId_fkey" FOREIGN KEY ("maintenanceRecordId") REFERENCES "maintenance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

