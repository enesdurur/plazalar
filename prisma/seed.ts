import { PrismaClient, OperationType } from "@prisma/client";
import bcrypt from "bcryptjs";
import rawRecords from "./seed-data/veri-tablosu.json";
import rawPeriodicInspections from "./seed-data/periyodik-muayene.json";
import { LINK_PLAZA_BUDGET_2026 } from "../src/lib/budget/link-plaza-2026";
import type { BudgetLineItem } from "../src/lib/budget/link-plaza-2026";
import {
  MAINTENANCE_PLAN_ITEMS_2026,
  INSPECTION_PLAN_ITEMS_2026,
} from "../src/lib/plan/link-plaza-2026";
import {
  TENANT_MAINTENANCE_TYPES,
  TENANT_MAINTENANCE_SCHEDULES,
} from "../src/lib/plan/tenant-maintenance-types";

const prisma = new PrismaClient();

const DEFAULT_ORGANIZATION_ID = "default-organization";

const PLAZAS = [
  "Square Plaza",
  "Link Plaza",
  "Olive Plaza",
  "DLP No.1 Plaza",
  "Uso Center",
  "Maslak No.19",
  "Maslak No.23-25 Plaza",
  "Fındıklı Abisa Plaza",
];

const ISSUE_TYPES = [
  "ELEKTRİK ARIZASI",
  "MEKANİK ARIZASI",
  "EKİPMAN DEĞİŞİMİ",
  "MUHTELİF İŞLER",
  "DIŞ TEKNİK HİZMET",
  "PLANLI PERİYODİK BAKIM",
  "TESİSAT",
];

const TECHNICIANS = ["Hüseyin Yılmaz", "Mustafa Durmuş"];

const SPARE_PARTS: { name: string; defaultCost: number }[] = [
  { name: "Rezistans", defaultCost: 15000 },
  { name: "Yağ borusu", defaultCost: 2750 },
  { name: "Piston (Boşaltma pistonu)", defaultCost: 24250 },
];

type RawRecord = {
  "Arıza Bildirim Zamanı": string;
  "Hat Adı": string;
  "Makine Adı": string;
  "ARIZA/BAKIM TANIMI": string;
  "İŞLEM TÜRÜ": "ARIZA" | "BAKIM";
  "ARIZA/BAKIM TÜRÜ": string;
  "Arıza/Bakımı Yapan": string | null;
  "Arıza Müdahale Zamanı": string | null;
  "Arıza Bitiş Zamanı": string | null;
  "YEDEK PARÇA MALİYETİ": number | null;
  "Yedek parça adet": number | null;
};

type RawPeriodicInspection = {
  "MAKİNA/ EKİPMAN KODU": string | number | null;
  "MAKİNA EKİPMAN ADI": string;
  Marka: string | null;
  "RAPOR NO": number | null;
  PERİYOT: string | null;
  "TEKNİK ÖZELLİK": string | null;
  "BAKIM TARİHİ": string | null;
  "BİR SONRAKİ BAKIM TARİHİ": string | null;
  "Bulunduğu Yer/Bölüm": string | null;
  "Sorumlu Kişinin Adı-Soyadı ve Unvanı": string | null;
};

async function main() {
  console.log("Seeding organization...");

  const organization = await prisma.organization.upsert({
    where: { id: DEFAULT_ORGANIZATION_ID },
    update: {},
    create: { id: DEFAULT_ORGANIZATION_ID, name: "Plazalar Teknik Hizmetler" },
  });

  console.log("Seeding plazas...");

  const plazas = new Map<string, string>();
  for (const name of PLAZAS) {
    const plaza = await prisma.plaza.upsert({
      where: { organizationId_name: { organizationId: organization.id, name } },
      update: {},
      create: { name, organizationId: organization.id },
    });
    plazas.set(name, plaza.id);
  }
  // Historical data (from the original Excel workbook) is attributed to the
  // first plaza. Reassign via the /machines UI if it actually belongs elsewhere.
  const squarePlazaId = plazas.get("Square Plaza")!;

  console.log("Seeding lookups...");

  const issueTypes = new Map<string, string>();
  for (const name of ISSUE_TYPES) {
    const issueType = await prisma.issueType.upsert({
      where: { organizationId_name: { organizationId: organization.id, name } },
      update: {},
      create: { name, organizationId: organization.id },
    });
    issueTypes.set(name, issueType.id);
  }

  const technicians = new Map<string, string>();
  for (const name of TECHNICIANS) {
    const technician = await prisma.technician.upsert({
      where: { organizationId_name: { organizationId: organization.id, name } },
      update: {},
      create: { name, organizationId: organization.id },
    });
    technicians.set(name, technician.id);
  }

  for (const part of SPARE_PARTS) {
    await prisma.sparePart.upsert({
      where: { organizationId_name: { organizationId: organization.id, name: part.name } },
      update: { defaultCost: part.defaultCost },
      create: { name: part.name, defaultCost: part.defaultCost, organizationId: organization.id },
    });
  }

  console.log("Seeding users...");

  const users = [
    { name: "Yönetici", email: "admin@plazalar.com", password: "Admin123!", role: "ADMIN" as const },
    { name: "Teknisyen", email: "teknisyen@plazalar.com", password: "Teknisyen123!", role: "TECHNICIAN" as const },
    { name: "İzleyici", email: "izleyici@plazalar.com", password: "Izleyici123!", role: "VIEWER" as const },
  ];

  let adminId = "";
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    // Kullanıcılar sekmesi (isPlatformAdmin) sadece organizasyonun asıl sahibinde olsun —
    // ADMIN rolü verilen diğer kişiler (ör. bir müdür yardımcısı) yazma/onay yetkisi alır
    // ama kullanıcı yönetimini göremez.
    const isPlatformAdmin = u.email === "admin@plazalar.com";
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { isPlatformAdmin },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        organizationId: organization.id,
        isPlatformAdmin,
      },
    });
    if (u.role === "ADMIN") adminId = created.id;
  }

  console.log("Seeding machines from historical records...");

  const records = rawRecords as RawRecord[];
  const machineIds = new Map<string, string>();
  for (const r of records) {
    const machineName = r["Makine Adı"];
    if (machineIds.has(machineName)) continue;
    const machine = await prisma.machine.upsert({
      where: { plazaId_name: { plazaId: squarePlazaId, name: machineName } },
      update: {},
      create: { name: machineName, plazaId: squarePlazaId },
    });
    machineIds.set(machineName, machine.id);
  }

  console.log(`Seeding ${records.length} maintenance records...`);

  for (const r of records) {
    const machineId = machineIds.get(r["Makine Adı"]);
    if (!machineId) continue;

    await prisma.maintenanceRecord.create({
      data: {
        machineId,
        operationType: r["İŞLEM TÜRÜ"] as OperationType,
        issueTypeId: issueTypes.get(r["ARIZA/BAKIM TÜRÜ"]),
        description: r["ARIZA/BAKIM TANIMI"],
        technicianId: r["Arıza/Bakımı Yapan"]
          ? technicians.get(r["Arıza/Bakımı Yapan"])
          : undefined,
        reportedAt: new Date(r["Arıza Bildirim Zamanı"]),
        respondedAt: r["Arıza Müdahale Zamanı"]
          ? new Date(r["Arıza Müdahale Zamanı"])
          : undefined,
        finishedAt: r["Arıza Bitiş Zamanı"]
          ? new Date(r["Arıza Bitiş Zamanı"])
          : undefined,
        sparePartCost: r["YEDEK PARÇA MALİYETİ"] ?? undefined,
        sparePartQty: r["Yedek parça adet"] ?? undefined,
        createdById: adminId,
      },
    });
  }

  console.log("Seeding periodic inspections...");

  const periodicInspections = rawPeriodicInspections as RawPeriodicInspection[];
  for (const r of periodicInspections) {
    await prisma.periodicInspection.create({
      data: {
        plazaId: squarePlazaId,
        code: r["MAKİNA/ EKİPMAN KODU"] != null ? String(r["MAKİNA/ EKİPMAN KODU"]) : undefined,
        name: r["MAKİNA EKİPMAN ADI"],
        brand: r["Marka"] ?? undefined,
        reportNo: r["RAPOR NO"] ?? undefined,
        period: r["PERİYOT"] ?? undefined,
        technicalFeature: r["TEKNİK ÖZELLİK"] ?? undefined,
        inspectionDate: r["BAKIM TARİHİ"] ? new Date(r["BAKIM TARİHİ"]) : undefined,
        nextInspectionDate: r["BİR SONRAKİ BAKIM TARİHİ"]
          ? new Date(r["BİR SONRAKİ BAKIM TARİHİ"])
          : undefined,
        location: r["Bulunduğu Yer/Bölüm"] ?? undefined,
        responsiblePerson: r["Sorumlu Kişinin Adı-Soyadı ve Unvanı"] ?? undefined,
      },
    });
  }

  console.log("Seeding Link Plaza gerçekleşen bütçe (2026)...");

  const linkPlazaId = plazas.get("Link Plaza");
  if (linkPlazaId) {
    const SECTIONS: {
      name: string;
      key: "personnelRows" | "managementRows" | "otherRows";
      sortOrder: number;
    }[] = [
      { name: "A- PERSONEL GİDERLERİ", key: "personnelRows", sortOrder: 0 },
      { name: "YÖNETİM GİDERLERİ", key: "managementRows", sortOrder: 1 },
      { name: "DİĞER GİDERLER", key: "otherRows", sortOrder: 2 },
    ];

    for (const s of SECTIONS) {
      const section = await prisma.budgetSection.upsert({
        where: { plazaId_year_name: { plazaId: linkPlazaId, year: 2026, name: s.name } },
        update: {},
        create: { plazaId: linkPlazaId, year: 2026, name: s.name, sortOrder: s.sortOrder },
      });

      const q1Rows: BudgetLineItem[] = LINK_PLAZA_BUDGET_2026[0][s.key];
      const q2Rows: BudgetLineItem[] = LINK_PLAZA_BUDGET_2026[1][s.key];

      for (let i = 0; i < q1Rows.length; i++) {
        const row = q1Rows[i];
        const lineItem = await prisma.budgetLineItem.upsert({
          where: { sectionId_label: { sectionId: section.id, label: row.label } },
          update: {},
          create: {
            sectionId: section.id,
            category: row.category ?? undefined,
            label: row.label,
            monthlyBudget: row.monthlyBudget,
            fill: row.fill ?? undefined,
            sortOrder: i,
          },
        });

        const monthlyActuals = [...q1Rows[i].months, ...q2Rows[i].months];
        for (let m = 0; m < monthlyActuals.length; m++) {
          await prisma.budgetMonthEntry.upsert({
            where: { lineItemId_month: { lineItemId: lineItem.id, month: m + 1 } },
            update: {},
            create: { lineItemId: lineItem.id, month: m + 1, manualAmount: monthlyActuals[m] },
          });
        }
      }
    }
  }

  console.log("Seeding Link Plaza yıllık bakım planı ve fenni muayene kalemleri (2026)...");

  if (linkPlazaId) {
    const linkMachines = await prisma.machine.findMany({
      where: { plazaId: linkPlazaId },
      select: { id: true, name: true },
    });
    const machineIdByName = new Map(linkMachines.map((m) => [m.name, m.id]));

    for (let i = 0; i < MAINTENANCE_PLAN_ITEMS_2026.length; i++) {
      const row = MAINTENANCE_PLAN_ITEMS_2026[i];
      const data = {
        company: row.company,
        yearlyCount: row.yearlyCount,
        scheduledWeeks: row.scheduledWeeks,
        machineId: row.machineName ? machineIdByName.get(row.machineName) : undefined,
        sortOrder: i,
      };
      await prisma.maintenancePlanItem.upsert({
        where: { plazaId_label: { plazaId: linkPlazaId, label: row.label } },
        update: data,
        create: { plazaId: linkPlazaId, label: row.label, ...data },
      });
    }

    for (let i = 0; i < INSPECTION_PLAN_ITEMS_2026.length; i++) {
      const row = INSPECTION_PLAN_ITEMS_2026[i];
      const data = {
        company: row.company,
        yearlyCount: row.yearlyCount,
        scheduledWeeks: row.scheduledWeeks,
        machineId: row.machineName ? machineIdByName.get(row.machineName) : undefined,
        sortOrder: i,
      };
      await prisma.inspectionPlanItem.upsert({
        where: { plazaId_label: { plazaId: linkPlazaId, label: row.label } },
        update: data,
        create: { plazaId: linkPlazaId, label: row.label, ...data },
      });
    }
  }

  console.log("Seeding kiracı bakım kalemleri (Fancoil / Elektrik)...");

  const allTenants = await prisma.tenant.findMany({ select: { id: true } });
  for (const tenant of allTenants) {
    for (let i = 0; i < TENANT_MAINTENANCE_TYPES.length; i++) {
      const label = TENANT_MAINTENANCE_TYPES[i];
      const scheduledWeeks = TENANT_MAINTENANCE_SCHEDULES[label];
      await prisma.tenantMaintenanceItem.upsert({
        where: { tenantId_label: { tenantId: tenant.id, label } },
        update: { scheduledWeeks },
        create: { tenantId: tenant.id, label, scheduledWeeks, sortOrder: i },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
