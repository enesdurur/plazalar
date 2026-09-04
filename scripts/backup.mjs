// Production veritabanının günlük yedeğini alır ve Vercel Blob'a yükler.
// GitHub Actions'daki .github/workflows/backup.yml tarafından çağrılır; elle de
// çalıştırılabilir: `node scripts/backup.mjs`.
//
// Ortam değişkenleri:
//   DATABASE_URL            - zorunlu. pg_dump için kullanılır.
//   PGDUMP_DATABASE_URL     - opsiyonel. Sağlayıcınız pooled/direct bağlantıyı
//                             ayırıyorsa (ör. PgBouncer/transaction modu pg_dump ile
//                             tam uyumlu olmayabilir), buraya "direct" bağlantı
//                             URL'ini verin; verilmezse DATABASE_URL kullanılır.
//   BLOB_READ_WRITE_TOKEN   - zorunlu. Vercel Blob yazma izni.
//
// Saklama politikası: son 30 günlük yedek + her ayın ilk günü alınan yedek
// (12 ay boyunca) tutulur, geri kalanı silinir.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { put, list, del } from "@vercel/blob";

const BLOB_PREFIX = "backups/";
const DAILY_RETENTION_DAYS = 30;
const MONTHLY_RETENTION_DAYS = 365;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Eksik ortam değişkeni: ${name}`);
    process.exit(1);
  }
  return value;
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Prisma'nın DATABASE_URL'inde geçen bazı sorgu parametreleri (schema, pgbouncer,
// connection_limit, pool_timeout) Prisma'ya özgüdür; libpq/pg_dump bunları tanımaz ve
// hata verir ("invalid URI query parameter"). pg_dump'a vermeden önce temizliyoruz —
// bu uygulamada zaten tek şema (public) kullanıldığı için schema'nın düşürülmesi
// zararsız.
const PG_DUMP_UNSUPPORTED_PARAMS = ["schema", "pgbouncer", "connection_limit", "pool_timeout"];

function sanitizeForPgDump(databaseUrl) {
  const url = new URL(databaseUrl);
  for (const param of PG_DUMP_UNSUPPORTED_PARAMS) {
    url.searchParams.delete(param);
  }
  return url.toString();
}

function dumpDatabase(databaseUrl, outFile) {
  console.log("pg_dump çalıştırılıyor...");
  const sanitizedUrl = sanitizeForPgDump(databaseUrl);
  execFileSync("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", "--file", outFile, sanitizedUrl], {
    stdio: "inherit",
  });
}

async function uploadBackup(filePath, fileName) {
  const buffer = readFileSync(filePath);
  console.log(`Vercel Blob'a yükleniyor: ${fileName} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
  const blob = await put(`${BLOB_PREFIX}${fileName}`, buffer, {
    access: "public",
    addRandomSuffix: true,
    token: requireEnv("BLOB_READ_WRITE_TOKEN"),
  });
  console.log(`Yüklendi: ${blob.pathname}`);
  return blob;
}

function parseDateFromPathname(pathname) {
  // beklenen: backups/plazalar-YYYY-MM-DD-<random>.dump
  const match = pathname.match(/plazalar-(\d{4}-\d{2}-\d{2})/);
  return match ? new Date(match[1] + "T00:00:00Z") : null;
}

async function pruneOldBackups() {
  console.log("Eski yedekler kontrol ediliyor...");
  const token = requireEnv("BLOB_READ_WRITE_TOKEN");
  const { blobs } = await list({ prefix: BLOB_PREFIX, token, limit: 1000 });
  const now = Date.now();

  let deleted = 0;
  for (const blob of blobs) {
    const backupDate = parseDateFromPathname(blob.pathname);
    if (!backupDate) continue; // beklenmeyen isimdeki dosyalara dokunma

    const ageDays = (now - backupDate.getTime()) / (1000 * 60 * 60 * 24);
    const isFirstOfMonth = backupDate.getUTCDate() === 1;

    const keep = ageDays <= DAILY_RETENTION_DAYS || (isFirstOfMonth && ageDays <= MONTHLY_RETENTION_DAYS);
    if (!keep) {
      await del(blob.url, { token });
      deleted++;
      console.log(`Silindi (${ageDays.toFixed(0)} gün, ayın ilk günü mü: ${isFirstOfMonth}): ${blob.pathname}`);
    }
  }
  console.log(`Saklama politikası uygulandı, ${deleted} eski yedek silindi.`);
}

async function main() {
  const databaseUrl = process.env.PGDUMP_DATABASE_URL || requireEnv("DATABASE_URL");
  const tmpDir = mkdtempSync(join(tmpdir(), "plazalar-backup-"));
  const fileName = `plazalar-${todayStamp()}.dump`;
  const outFile = join(tmpDir, fileName);

  try {
    dumpDatabase(databaseUrl, outFile);
    await uploadBackup(outFile, fileName);
    await pruneOldBackups();
    console.log("Yedekleme tamamlandı.");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("Yedekleme başarısız:", err);
  process.exit(1);
});
