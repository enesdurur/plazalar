-- CreateTable
CREATE TABLE "tenant_maintenance_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "scheduledWeeks" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_maintenance_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_maintenance_week_entries" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "completed" BOOLEAN,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_maintenance_week_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_maintenance_items_tenantId_idx" ON "tenant_maintenance_items"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_maintenance_items_tenantId_label_key" ON "tenant_maintenance_items"("tenantId", "label");

-- CreateIndex
CREATE INDEX "tenant_maintenance_week_entries_year_week_idx" ON "tenant_maintenance_week_entries"("year", "week");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_maintenance_week_entries_itemId_year_week_key" ON "tenant_maintenance_week_entries"("itemId", "year", "week");

-- AddForeignKey
ALTER TABLE "tenant_maintenance_items" ADD CONSTRAINT "tenant_maintenance_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_maintenance_week_entries" ADD CONSTRAINT "tenant_maintenance_week_entries_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "tenant_maintenance_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

