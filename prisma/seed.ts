import { PrismaClient, OperationType } from "@prisma/client";
import bcrypt from "bcryptjs";
import rawRecords from "./seed-data/veri-tablosu.json";

const prisma = new PrismaClient();

const LINES = ["PROSES 1", "PROSES 2", "PROSES 3", "PROSES 4", "PROSES 5"];

const ISSUE_TYPES = [
  "ELEKTRİK ARIZASI",
  "MEKANİK ARIZASI",
  "EKİPMAN DEĞİŞİMİ",
  "MUHTELİF İŞLER",
  "DIŞ TEKNİK HİZMET",
  "PLANLI PERİYODİK BAKIM",
  "TESİSAT",
];

const TECHNICIANS = [
  "M. ALTIN",
  "B. YETKİN",
  "D. SEÇİL",
  "İ. YERLİ",
  "K. DOĞRUL",
  "AZ-SK",
  "BK-DK-GA",
  "BK-FÖ-DK",
  "BK-GA",
  "MUY-RU",
];

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

async function main() {
  console.log("Seeding lookups...");

  const lines = new Map<string, string>();
  for (const name of LINES) {
    const line = await prisma.line.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    lines.set(name, line.id);
  }

  const issueTypes = new Map<string, string>();
  for (const name of ISSUE_TYPES) {
    const issueType = await prisma.issueType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    issueTypes.set(name, issueType.id);
  }

  const technicians = new Map<string, string>();
  for (const name of TECHNICIANS) {
    const technician = await prisma.technician.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    technicians.set(name, technician.id);
  }

  for (const part of SPARE_PARTS) {
    await prisma.sparePart.upsert({
      where: { name: part.name },
      update: { defaultCost: part.defaultCost },
      create: { name: part.name, defaultCost: part.defaultCost },
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
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    });
    if (u.role === "ADMIN") adminId = created.id;
  }

  console.log("Seeding machines from historical records...");

  const records = rawRecords as RawRecord[];
  const machineIds = new Map<string, string>();
  for (const r of records) {
    const machineName = r["Makine Adı"];
    if (machineIds.has(machineName)) continue;
    const lineId = lines.get(r["Hat Adı"]);
    const machine = await prisma.machine.upsert({
      where: { name: machineName },
      update: {},
      create: { name: machineName, lineId },
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
