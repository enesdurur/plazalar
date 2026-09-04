import { z, ZodError, type ZodType } from "zod";

/**
 * schema.parse()'ı sarar: ZodError fırlarsa (ör. eksik/yanlış form alanı), ilk hata
 * mesajını taşıyan sade bir Error'a çevirir. Server Action'lardan throw edilen hatalar
 * en yakın error.tsx'e düşüyor ve orada error.message doğrudan kullanıcıya gösteriliyor
 * — bu yüzden mesaj Türkçe ve okunabilir olmalı, ham ZodError JSON'u değil.
 */
export function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.issues[0]?.message ?? "Girilen bilgiler geçersiz.";
      throw new Error(message);
    }
    throw err;
  }
}

/**
 * Zorunlu bir tarih string alanı: boş değil VE `new Date()` ile ayrıştırılabilir
 * olmalı. Sadece "boş değil" (min(1)) kontrolü, "31/02/2026" gibi görünüşte dolu ama
 * `new Date()` ile Invalid Date üreten girdileri yakalamıyordu.
 */
export function zRequiredDateString(message = "Geçerli bir tarih girin") {
  return z
    .string()
    .min(1, message)
    .refine((v) => !Number.isNaN(Date.parse(v)), { message });
}

/**
 * Opsiyonel bir tarih string alanı — form katmanında emptyToUndefined() ile boş
 * string'ler zaten undefined'a çevrildiği için burada sadece dolu değerin geçerli bir
 * tarih olduğunu doğruluyoruz.
 */
export function zOptionalDateString(message = "Geçerli bir tarih girin") {
  return z
    .string()
    .optional()
    .refine((v) => v === undefined || !Number.isNaN(Date.parse(v)), { message });
}
