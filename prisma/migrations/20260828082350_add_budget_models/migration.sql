-- CreateTable
CREATE TABLE "budget_sections" (
    "id" TEXT NOT NULL,
    "plazaId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_line_items" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "category" TEXT,
    "label" TEXT NOT NULL,
    "monthlyBudget" DECIMAL(12,2) NOT NULL,
    "isFixedContract" BOOLEAN NOT NULL DEFAULT false,
    "fixedAmount" DECIMAL(12,2),
    "fill" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_month_entries" (
    "id" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "manualAmount" DECIMAL(12,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_month_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budget_sections_plazaId_year_name_key" ON "budget_sections"("plazaId", "year", "name");

-- CreateIndex
CREATE UNIQUE INDEX "budget_line_items_sectionId_label_key" ON "budget_line_items"("sectionId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "budget_month_entries_lineItemId_month_key" ON "budget_month_entries"("lineItemId", "month");

-- AddForeignKey
ALTER TABLE "budget_sections" ADD CONSTRAINT "budget_sections_plazaId_fkey" FOREIGN KEY ("plazaId") REFERENCES "plazas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "budget_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_month_entries" ADD CONSTRAINT "budget_month_entries_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "budget_line_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
