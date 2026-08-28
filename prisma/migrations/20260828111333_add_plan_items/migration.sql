-- CreateTable
CREATE TABLE "maintenance_plan_items" (
    "id" TEXT NOT NULL,
    "plazaId" TEXT NOT NULL,
    "machineId" TEXT,
    "label" TEXT NOT NULL,
    "company" TEXT,
    "yearlyCount" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_plan_week_entries" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "completed" BOOLEAN,
    "note" TEXT,
    "cost" DECIMAL(12,2),
    "costCurrency" "Currency" NOT NULL DEFAULT 'TRY',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_plan_week_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_plan_items" (
    "id" TEXT NOT NULL,
    "plazaId" TEXT NOT NULL,
    "machineId" TEXT,
    "label" TEXT NOT NULL,
    "company" TEXT,
    "yearlyCount" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_plan_week_entries" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "completed" BOOLEAN,
    "note" TEXT,
    "cost" DECIMAL(12,2),
    "costCurrency" "Currency" NOT NULL DEFAULT 'TRY',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_plan_week_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_plan_items_plazaId_idx" ON "maintenance_plan_items"("plazaId");

-- CreateIndex
CREATE INDEX "maintenance_plan_week_entries_year_week_idx" ON "maintenance_plan_week_entries"("year", "week");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_plan_week_entries_itemId_year_week_key" ON "maintenance_plan_week_entries"("itemId", "year", "week");

-- CreateIndex
CREATE INDEX "inspection_plan_items_plazaId_idx" ON "inspection_plan_items"("plazaId");

-- CreateIndex
CREATE INDEX "inspection_plan_week_entries_year_week_idx" ON "inspection_plan_week_entries"("year", "week");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_plan_week_entries_itemId_year_week_key" ON "inspection_plan_week_entries"("itemId", "year", "week");

-- AddForeignKey
ALTER TABLE "maintenance_plan_items" ADD CONSTRAINT "maintenance_plan_items_plazaId_fkey" FOREIGN KEY ("plazaId") REFERENCES "plazas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plan_items" ADD CONSTRAINT "maintenance_plan_items_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plan_week_entries" ADD CONSTRAINT "maintenance_plan_week_entries_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "maintenance_plan_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_plan_items" ADD CONSTRAINT "inspection_plan_items_plazaId_fkey" FOREIGN KEY ("plazaId") REFERENCES "plazas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_plan_items" ADD CONSTRAINT "inspection_plan_items_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_plan_week_entries" ADD CONSTRAINT "inspection_plan_week_entries_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inspection_plan_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

