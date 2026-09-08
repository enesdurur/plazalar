-- Add plazaId as nullable first so we can backfill existing rows.
ALTER TABLE "maintenance_records" ADD COLUMN "plazaId" TEXT;

-- Backfill from the existing machine relation (every current row has a machine).
UPDATE "maintenance_records" mr
SET "plazaId" = m."plazaId"
FROM "machines" m
WHERE m.id = mr."machineId";

-- Now that every row has a plazaId, enforce NOT NULL + index + FK.
ALTER TABLE "maintenance_records" ALTER COLUMN "plazaId" SET NOT NULL;
CREATE INDEX "maintenance_records_plazaId_idx" ON "maintenance_records"("plazaId");
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_plazaId_fkey" FOREIGN KEY ("plazaId") REFERENCES "plazas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- machineId becomes optional (general, non-equipment work has no machine).
ALTER TABLE "maintenance_records" DROP CONSTRAINT "maintenance_records_machineId_fkey";
ALTER TABLE "maintenance_records" ALTER COLUMN "machineId" DROP NOT NULL;
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
