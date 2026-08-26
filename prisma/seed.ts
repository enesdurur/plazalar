import { PrismaClient, OperationType } from "@prisma/client";
import bcrypt from "bcryptjs";
import rawRecords from "./seed-data/veri-tablosu.json";
import rawPeriodicInspections from "./seed-data/periyodik-muayene.json";
import rawCalibrations from "./seed-data/kalibrasyon.json";
import rawVerifications from "./seed-data/dogrulama.json";

const prisma = new PrismaClient();

const PLAZAS = ["Square Plaza", "Link Plaza", "Olive Plaza", "DLP No.1 Plaza", "Uso Center"];

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

type RawCalibration = {
  "ÖLÇÜM ALETİ KODU": string | number | null;
  "Cihaz Adı": string;
  Marka: string | null;
  Model: string | null;
  "Seri No": string | number | null;
  "Kalibrasyon Firması": string | null;
  "Sertifika No": string | null;
  "Ölçüm Aralığı": string | number | null;
  Hassasiyet: string | number | null;
  "Son Kalibrasyon Tarihi": string | null;
  "Bir Sonraki Kalibrasyon Tarihi": string | null;
  "Bulunduğu Yer/Bölüm": string | null;
  "Sorumlu Kişinin Adı-Soyadı ve Unvanı": string | null;
};

type RawVerification = {
  "Cihaz Adı": string;
  "Seri No": string | number | null;
  "Kullanım Yeri": string | null;
  "Teslim Alan": string | null;
  "DOĞRULAMA PERİYODU": string | null;
  "REFERANS SERTİFİKA NO": string | null;
  "Ölçüm Aralığı ": string | number | null;
  Sonuç: string | null;
  "DOĞRULAMA TARİHİ": string | null;
  "GELECEK DOĞRULAMA TARİHİ": string | null;
};

async function main() {
  console.log("Seeding plazas...");

  const plazas = new Map<string, string>();
  for (const name of PLAZAS) {
    const plaza = await prisma.plaza.upsert({
      where: { name },
      update: {},
      create: { name },
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

  console.log("Seeding calibrations...");

  const calibrations = rawCalibrations as RawCalibration[];
  for (const r of calibrations) {
    await prisma.calibration.create({
      data: {
        code: r["ÖLÇÜM ALETİ KODU"] != null ? String(r["ÖLÇÜM ALETİ KODU"]) : undefined,
        deviceName: r["Cihaz Adı"],
        brand: r["Marka"] ?? undefined,
        model: r["Model"] ?? undefined,
        serialNo: r["Seri No"] != null ? String(r["Seri No"]) : undefined,
        calibrationCompany: r["Kalibrasyon Firması"] ?? undefined,
        certificateNo: r["Sertifika No"] ?? undefined,
        measurementRange:
          r["Ölçüm Aralığı"] != null ? String(r["Ölçüm Aralığı"]) : undefined,
        precision: r["Hassasiyet"] != null ? String(r["Hassasiyet"]) : undefined,
        lastCalibrationDate: r["Son Kalibrasyon Tarihi"]
          ? new Date(r["Son Kalibrasyon Tarihi"])
          : undefined,
        nextCalibrationDate: r["Bir Sonraki Kalibrasyon Tarihi"]
          ? new Date(r["Bir Sonraki Kalibrasyon Tarihi"])
          : undefined,
        location: r["Bulunduğu Yer/Bölüm"] ?? undefined,
        responsiblePerson: r["Sorumlu Kişinin Adı-Soyadı ve Unvanı"] ?? undefined,
      },
    });
  }

  console.log("Seeding verifications...");

  const verifications = rawVerifications as RawVerification[];
  for (const r of verifications) {
    await prisma.verification.create({
      data: {
        deviceName: r["Cihaz Adı"],
        deviceSerialNo: r["Seri No"] != null ? String(r["Seri No"]) : undefined,
        usageLocation: r["Kullanım Yeri"] ?? undefined,
        receivedBy: r["Teslim Alan"] ?? undefined,
        verificationPeriod: r["DOĞRULAMA PERİYODU"] ?? undefined,
        referenceCertificateNo: r["REFERANS SERTİFİKA NO"] ?? undefined,
        measurementRange:
          r["Ölçüm Aralığı "] != null ? String(r["Ölçüm Aralığı "]) : undefined,
        result: r["Sonuç"] ?? undefined,
        verificationDate: r["DOĞRULAMA TARİHİ"] ? new Date(r["DOĞRULAMA TARİHİ"]) : undefined,
        nextVerificationDate: r["GELECEK DOĞRULAMA TARİHİ"]
          ? new Date(r["GELECEK DOĞRULAMA TARİHİ"])
          : undefined,
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
