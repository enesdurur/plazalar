-- CreateTable
CREATE TABLE "periodic_inspections" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "reportNo" INTEGER,
    "period" TEXT,
    "technicalFeature" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "nextInspectionDate" TIMESTAMP(3),
    "location" TEXT,
    "responsiblePerson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periodic_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibrations" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "deviceName" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNo" TEXT,
    "calibrationCompany" TEXT,
    "certificateNo" TEXT,
    "measurementRange" TEXT,
    "precision" TEXT,
    "lastCalibrationDate" TIMESTAMP(3),
    "nextCalibrationDate" TIMESTAMP(3),
    "location" TEXT,
    "responsiblePerson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calibrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceSerialNo" TEXT,
    "usageLocation" TEXT,
    "receivedBy" TEXT,
    "verificationPeriod" TEXT,
    "referenceCertificateNo" TEXT,
    "measurementRange" TEXT,
    "result" TEXT,
    "verificationDate" TIMESTAMP(3),
    "nextVerificationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "periodic_inspections_nextInspectionDate_idx" ON "periodic_inspections"("nextInspectionDate");

-- CreateIndex
CREATE INDEX "calibrations_nextCalibrationDate_idx" ON "calibrations"("nextCalibrationDate");

-- CreateIndex
CREATE INDEX "verifications_nextVerificationDate_idx" ON "verifications"("nextVerificationDate");
