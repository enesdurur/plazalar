-- DropForeignKey
ALTER TABLE "inspection_plan_items" DROP CONSTRAINT "inspection_plan_items_machineId_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_plan_items" DROP CONSTRAINT "maintenance_plan_items_machineId_fkey";

-- AlterTable
ALTER TABLE "inspection_plan_items" DROP COLUMN "machineId";

-- AlterTable
ALTER TABLE "maintenance_plan_items" DROP COLUMN "machineId";

-- CreateTable
CREATE TABLE "_MachineToMaintenancePlanItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MachineToMaintenancePlanItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InspectionPlanItemToMachine" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InspectionPlanItemToMachine_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MachineToMaintenancePlanItem_B_index" ON "_MachineToMaintenancePlanItem"("B");

-- CreateIndex
CREATE INDEX "_InspectionPlanItemToMachine_B_index" ON "_InspectionPlanItemToMachine"("B");

-- AddForeignKey
ALTER TABLE "_MachineToMaintenancePlanItem" ADD CONSTRAINT "_MachineToMaintenancePlanItem_A_fkey" FOREIGN KEY ("A") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MachineToMaintenancePlanItem" ADD CONSTRAINT "_MachineToMaintenancePlanItem_B_fkey" FOREIGN KEY ("B") REFERENCES "maintenance_plan_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InspectionPlanItemToMachine" ADD CONSTRAINT "_InspectionPlanItemToMachine_A_fkey" FOREIGN KEY ("A") REFERENCES "inspection_plan_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InspectionPlanItemToMachine" ADD CONSTRAINT "_InspectionPlanItemToMachine_B_fkey" FOREIGN KEY ("B") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
