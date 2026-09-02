-- CreateTable
CREATE TABLE "organizations" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "slug"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- Seed the one real organization to hold all pre-existing data
INSERT INTO "organizations" ("id", "name") VALUES ('default-organization', 'Plazalar Teknik Hizmetler');

-- AlterTable: users
ALTER TABLE "users" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "users" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;
UPDATE "users" SET "organizationId" = 'default-organization';
ALTER TABLE "users" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: plazas
ALTER TABLE "plazas" ADD COLUMN "organizationId" TEXT;
UPDATE "plazas" SET "organizationId" = 'default-organization';
ALTER TABLE "plazas" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "plazas" DROP CONSTRAINT IF EXISTS "plazas_name_key";
CREATE UNIQUE INDEX "plazas_organizationId_name_key" ON "plazas"("organizationId", "name");
CREATE INDEX "plazas_organizationId_idx" ON "plazas"("organizationId");
ALTER TABLE "plazas" ADD CONSTRAINT "plazas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: issue_types
ALTER TABLE "issue_types" ADD COLUMN "organizationId" TEXT;
UPDATE "issue_types" SET "organizationId" = 'default-organization';
ALTER TABLE "issue_types" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "issue_types" DROP CONSTRAINT IF EXISTS "issue_types_name_key";
CREATE UNIQUE INDEX "issue_types_organizationId_name_key" ON "issue_types"("organizationId", "name");
CREATE INDEX "issue_types_organizationId_idx" ON "issue_types"("organizationId");
ALTER TABLE "issue_types" ADD CONSTRAINT "issue_types_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: technicians
ALTER TABLE "technicians" ADD COLUMN "organizationId" TEXT;
UPDATE "technicians" SET "organizationId" = 'default-organization';
ALTER TABLE "technicians" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "technicians" DROP CONSTRAINT IF EXISTS "technicians_name_key";
CREATE UNIQUE INDEX "technicians_organizationId_name_key" ON "technicians"("organizationId", "name");
CREATE INDEX "technicians_organizationId_idx" ON "technicians"("organizationId");
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: spare_parts
ALTER TABLE "spare_parts" ADD COLUMN "organizationId" TEXT;
UPDATE "spare_parts" SET "organizationId" = 'default-organization';
ALTER TABLE "spare_parts" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "spare_parts" DROP CONSTRAINT IF EXISTS "spare_parts_name_key";
CREATE UNIQUE INDEX "spare_parts_organizationId_name_key" ON "spare_parts"("organizationId", "name");
CREATE INDEX "spare_parts_organizationId_idx" ON "spare_parts"("organizationId");
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropTable: unused Kalibrasyon Planı / Doğrulama Planı feature, removed entirely
DROP TABLE IF EXISTS "calibrations";
DROP TABLE IF EXISTS "verifications";
