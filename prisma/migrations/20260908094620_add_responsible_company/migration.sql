-- CreateEnum
CREATE TYPE "ResponsibleCompany" AS ENUM ('KAPITAL', 'BURGAZ');

-- AlterTable
ALTER TABLE "maintenance_records" ADD COLUMN     "responsibleCompany" "ResponsibleCompany" NOT NULL DEFAULT 'BURGAZ';
