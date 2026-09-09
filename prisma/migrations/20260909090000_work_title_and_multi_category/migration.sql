-- AlterTable: İş Süreci başlığı — description'dan bağımsız, ayrı saklanır.
ALTER TABLE "maintenance_records" ADD COLUMN "workTitle" TEXT;

-- CreateTable: Kategori artık çoklu seçime açık (implicit many-to-many).
CREATE TABLE "_IssueTypeToMaintenanceRecord" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IssueTypeToMaintenanceRecord_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_IssueTypeToMaintenanceRecord_B_index" ON "_IssueTypeToMaintenanceRecord"("B");

ALTER TABLE "_IssueTypeToMaintenanceRecord" ADD CONSTRAINT "_IssueTypeToMaintenanceRecord_A_fkey" FOREIGN KEY ("A") REFERENCES "issue_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_IssueTypeToMaintenanceRecord" ADD CONSTRAINT "_IssueTypeToMaintenanceRecord_B_fkey" FOREIGN KEY ("B") REFERENCES "maintenance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mevcut tekli kategori verisini yeni çoklu ilişkiye taşı.
INSERT INTO "_IssueTypeToMaintenanceRecord" ("A", "B")
SELECT "issueTypeId", "id" FROM "maintenance_records" WHERE "issueTypeId" IS NOT NULL;

-- Eski tekli kategori kolonunu ve FK'ını kaldır.
ALTER TABLE "maintenance_records" DROP CONSTRAINT "maintenance_records_issueTypeId_fkey";
ALTER TABLE "maintenance_records" DROP COLUMN "issueTypeId";
