-- CreateTable
CREATE TABLE "maintenance_plan_entries" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "completed" BOOLEAN,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_plan_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_plan_entries_year_month_idx" ON "maintenance_plan_entries"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_plan_entries_machineId_year_month_key" ON "maintenance_plan_entries"("machineId", "year", "month");

-- AddForeignKey
ALTER TABLE "maintenance_plan_entries" ADD CONSTRAINT "maintenance_plan_entries_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
