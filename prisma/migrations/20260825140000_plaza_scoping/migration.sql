-- CreateTable
CREATE TABLE "plazas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plazas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plazas_name_key" ON "plazas"("name");

-- Seed a default plaza to hold pre-existing data
INSERT INTO "plazas" ("id", "name") VALUES ('default-square-plaza', 'Square Plaza');

-- AlterTable: machines
ALTER TABLE "machines" ADD COLUMN "plazaId" TEXT;
UPDATE "machines" SET "plazaId" = 'default-square-plaza';
ALTER TABLE "machines" ALTER COLUMN "plazaId" SET NOT NULL;

ALTER TABLE "machines" DROP CONSTRAINT IF EXISTS "machines_name_key";
DROP INDEX IF EXISTS "machines_code_key";

CREATE UNIQUE INDEX "machines_plazaId_name_key" ON "machines"("plazaId", "name");
CREATE UNIQUE INDEX "machines_plazaId_code_key" ON "machines"("plazaId", "code");

ALTER TABLE "machines" ADD CONSTRAINT "machines_plazaId_fkey" FOREIGN KEY ("plazaId") REFERENCES "plazas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: periodic_inspections
ALTER TABLE "periodic_inspections" ADD COLUMN "plazaId" TEXT;
UPDATE "periodic_inspections" SET "plazaId" = 'default-square-plaza';
ALTER TABLE "periodic_inspections" ALTER COLUMN "plazaId" SET NOT NULL;

CREATE INDEX "periodic_inspections_plazaId_idx" ON "periodic_inspections"("plazaId");

ALTER TABLE "periodic_inspections" ADD CONSTRAINT "periodic_inspections_plazaId_fkey" FOREIGN KEY ("plazaId") REFERENCES "plazas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
