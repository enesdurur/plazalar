-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "plazaId" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_maintenances" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "period" TEXT,
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "responsiblePerson" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenants_plazaId_idx" ON "tenants"("plazaId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_plazaId_floor_key" ON "tenants"("plazaId", "floor");

-- CreateIndex
CREATE INDEX "tenant_maintenances_tenantId_idx" ON "tenant_maintenances"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_maintenances_nextMaintenanceDate_idx" ON "tenant_maintenances"("nextMaintenanceDate");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_plazaId_fkey" FOREIGN KEY ("plazaId") REFERENCES "plazas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_maintenances" ADD CONSTRAINT "tenant_maintenances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
