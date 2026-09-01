-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'STPU';
ALTER TYPE "Role" ADD VALUE 'MANAGEMENT_DIRECTOR';

-- AlterTable
ALTER TABLE "inspection_plan_week_entries" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT;

-- AlterTable
ALTER TABLE "maintenance_plan_week_entries" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT;

-- AlterTable
ALTER TABLE "maintenance_records" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plan_week_entries" ADD CONSTRAINT "maintenance_plan_week_entries_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_plan_week_entries" ADD CONSTRAINT "inspection_plan_week_entries_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Bu onay akışından önce girilmiş maliyetler zaten Gerçekleşen Bütçe'ye yansımıştı; onay
-- zorunluluğu yalnızca bundan sonraki girişler/düzenlemeler için geçerli olsun diye mevcut
-- maliyetli kayıtları "onaylanmış" olarak işaretliyoruz (aksi halde bütçe rakamları sıfırlanır).
UPDATE "maintenance_plan_week_entries"
SET "approved" = true
WHERE "cost" IS NOT NULL OR "sparePartCost" IS NOT NULL;

UPDATE "inspection_plan_week_entries"
SET "approved" = true
WHERE "cost" IS NOT NULL OR "sparePartCost" IS NOT NULL;

UPDATE "maintenance_records"
SET "approved" = true
WHERE "operationType" = 'ARIZA' AND "sparePartCost" IS NOT NULL;

