import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import type { AttachmentKind } from "@prisma/client";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

type AttachmentTarget =
  | { planWeekEntryId: string }
  | { inspectionWeekEntryId: string }
  | { maintenanceRecordId: string }
  | { otherExpenseEntryId: string };

// Attachment tablosunda organizationId/plazaId sütunu yok — sahiplik ilişki zinciri
// (planWeekEntry.item.plazaId, ör.) üzerinden dolaylı olarak belirleniyor. Çağıran her
// yerde zaten kendi plazaId'sini biliyor (getSelectedPlaza() üzerinden); bunu buraya da
// vermelerini isteyerek, ileride bir çağıranın sahiplik kontrolünü atlamasına karşı bu
// fonksiyonların kendi içinde de bir savunma katmanı oluşturuyoruz.
function scopedToPlaza(plazaId: string) {
  return {
    OR: [
      { planWeekEntry: { item: { plazaId } } },
      { inspectionWeekEntry: { item: { plazaId } } },
      { maintenanceRecord: { machine: { plazaId } } },
      { otherExpenseEntry: { lineItem: { section: { plazaId } } } },
    ],
  };
}

/**
 * Server Action'lardan dönülen sonuç şekli. Next.js, Server Action'lardan throw edilen
 * hataların mesajını production'da sansürlüyor ("Server Components render" hatası) —
 * bu yüzden hataları throw etmek yerine bu tip üzerinden geri döndürüyoruz.
 */
export type AttachmentActionResult = { error: string | null };

/**
 * Yeni bir fatura/bakım formu dosyası yükler. Aynı kayıt+tür için zaten bir dosya varsa
 * (Blob + DB satırı) önce onu siler — böylece her zaman en fazla bir aktif dosya kalır.
 */
export async function saveAttachment({
  kind,
  file,
  target,
  uploaderId,
  plazaId,
}: {
  kind: AttachmentKind;
  file: File;
  target: AttachmentTarget;
  uploaderId: string;
  plazaId: string;
}) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Dosya depolama yapılandırılmamış (BLOB_READ_WRITE_TOKEN eksik). Lütfen yöneticinizle iletişime geçin."
    );
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Sadece PDF veya görsel (JPEG/PNG/WEBP/HEIC) dosyaları yüklenebilir.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Dosya boyutu 15MB'ı aşamaz.");
  }

  const existing = await prisma.attachment.findFirst({
    where: { kind, ...target, ...scopedToPlaza(plazaId) },
  });
  if (existing) {
    await del(existing.fileUrl).catch(() => {});
    await prisma.attachment.delete({ where: { id: existing.id } });
  }

  const folder = kind === "INVOICE" ? "faturalar" : "bakim-formlari";
  const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return prisma.attachment.create({
    data: {
      kind,
      fileName: file.name,
      fileUrl: blob.url,
      mimeType: file.type,
      fileSize: file.size,
      uploadedById: uploaderId,
      ...target,
    },
  });
}

/** Prisma'dan gelen bir Attachment satırını (uploadedBy dahil) client component'lere
 * aktarılabilir düz bir nesneye çevirir (Date -> ISO string). */
export function toAttachmentInfo(
  a:
    | { id: string; fileName: string; fileUrl: string; uploadedAt: Date; uploadedBy: { name: string } | null }
    | null
    | undefined
) {
  if (!a) return null;
  return {
    id: a.id,
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    uploadedAt: a.uploadedAt.toISOString(),
    uploaderName: a.uploadedBy?.name ?? null,
  };
}

export async function removeAttachment(attachmentId: string, plazaId: string) {
  const existing = await prisma.attachment.findFirst({
    where: { id: attachmentId, ...scopedToPlaza(plazaId) },
  });
  if (!existing) return;
  await del(existing.fileUrl).catch(() => {});
  await prisma.attachment.delete({ where: { id: attachmentId } });
}
