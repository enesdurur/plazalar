-- AlterTable
ALTER TABLE "inspection_plan_items" ADD COLUMN     "scheduledWeeks" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "maintenance_plan_items" ADD COLUMN     "scheduledWeeks" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- CreateIndex
CREATE UNIQUE INDEX "inspection_plan_items_plazaId_label_key" ON "inspection_plan_items"("plazaId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_plan_items_plazaId_label_key" ON "maintenance_plan_items"("plazaId", "label");

