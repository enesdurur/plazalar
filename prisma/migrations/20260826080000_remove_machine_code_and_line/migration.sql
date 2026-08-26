-- DropForeignKey
ALTER TABLE "machines" DROP CONSTRAINT "machines_lineId_fkey";

-- DropIndex
DROP INDEX "machines_lineId_idx";

-- DropIndex
DROP INDEX "machines_plazaId_code_key";

-- AlterTable
ALTER TABLE "machines" DROP COLUMN "code",
DROP COLUMN "lineId";

-- DropTable
DROP TABLE "lines";
