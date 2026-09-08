-- AlterTable
ALTER TABLE "maintenance_records" ADD COLUMN     "awardedAmount" DECIMAL(12,2),
ADD COLUMN     "awardedContractor" TEXT,
ADD COLUMN     "awardedCurrency" "Currency" DEFAULT 'TRY',
ADD COLUMN     "invoiceAmount" DECIMAL(12,2),
ADD COLUMN     "invoiceCurrency" "Currency" DEFAULT 'TRY',
ADD COLUMN     "invoiceExchangeRate" DECIMAL(10,4),
ADD COLUMN     "invoiceNo" TEXT,
ADD COLUMN     "invoicedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "record_quotes" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "contractorName" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'TRY',
    "note" TEXT,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_payments" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'TRY',
    "paidAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "record_quotes_recordId_idx" ON "record_quotes"("recordId");

-- CreateIndex
CREATE INDEX "record_payments_recordId_idx" ON "record_payments"("recordId");

-- AddForeignKey
ALTER TABLE "record_quotes" ADD CONSTRAINT "record_quotes_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "maintenance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_payments" ADD CONSTRAINT "record_payments_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "maintenance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

