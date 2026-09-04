# Plazalar Teknik Hizmetler — Bakım & Arıza Yönetim Sistemi

Fabrika teknik hizmetler ekibi için web tabanlı bakım/arıza takip sistemi (CMMS).
Excel'deki "Teknik Hizmetler KPI Analizi" tablosu temel alınarak modellenmiştir.

## Teknoloji

- **Next.js** (App Router, TypeScript) — frontend + backend tek projede
- **PostgreSQL** + **Prisma ORM**
- **NextAuth v5** (Credentials provider, JWT session) — kullanıcı girişi ve rol yönetimi
- **Tailwind CSS**

## Modüller (mevcut)

- **Panel**: MTTA / MTTR, işlem türü dağılımı, hat bazında kayıt sayısı, en çok duran makineler
- **Makine / Teçhizat**: makine/ekipman master verisi (kod, marka, model, hat, pano vb.)
- **Arıza / Bakım Kayıtları**: arıza/bakım kaydı girişi, süre ve maliyet takibi

Sıradaki modüller (Excel'deki diğer sayfalara karşılık gelir): Periyodik Muayene
Planı, Kalibrasyon Planı, Doğrulama Planı, Yıllık Bakım Planı.

## Roller

- **ADMIN**: tüm yetkiler (silme dahil)
- **TECHNICIAN**: kayıt/makine oluşturma ve düzenleme
- **VIEWER**: sadece görüntüleme

## Kurulum

```bash
npm install

# .env dosyasını oluşturun (DATABASE_URL, AUTH_SECRET, AUTH_TRUST_HOST)
cp .env.example .env

npx prisma migrate deploy
npm run db:seed   # örnek veri + admin/teknisyen/izleyici kullanıcıları oluşturur

npm run dev
```

Seed sonrası giriş bilgileri:

| Rol | E-posta | Şifre |
|---|---|---|
| Admin | admin@plazalar.com | Admin123! |
| Teknisyen | teknisyen@plazalar.com | Teknisyen123! |
| İzleyici | izleyici@plazalar.com | Izleyici123! |

> Üretime almadan önce bu şifreleri değiştirin ve `AUTH_SECRET` değerini
> `openssl rand -base64 32` ile yeniden üretin.

## Geliştirme komutları

```bash
npm run dev         # geliştirme sunucusu
npm run build        # üretim derlemesi
npm run lint          # eslint
npx prisma studio    # veritabanını arayüzden görüntüle
npm run db:seed       # veritabanını örnek veriyle doldur
```

## Yedekleme

Production veritabanı `.github/workflows/backup.yml` ile her gün otomatik yedeklenir
(`scripts/backup.mjs`): `pg_dump --format=custom` alınır, Vercel Blob'a (`backups/`
altına) yüklenir. Saklama politikası: son 30 günün her günü + her ayın 1'inde alınan
yedek 12 ay boyunca tutulur, gerisi otomatik silinir.

**Gerekli GitHub Actions secret'ları** (repo → Settings → Secrets and variables →
Actions):

| Secret | Açıklama |
|---|---|
| `DATABASE_URL` | Production bağlantı adresi (Vercel proje ayarlarından kopyalanır) |
| `PGDUMP_DATABASE_URL` | Opsiyonel — sağlayıcınız pooled/direct bağlantıyı ayırıyorsa (ör. PgBouncer) `pg_dump` için direkt bağlantı adresi. Verilmezse `DATABASE_URL` kullanılır |
| `BLOB_READ_WRITE_TOKEN` | Vercel proje ayarlarından, uygulamanın kendisinin de kullandığı Blob token'ı |

Elle tetiklemek için: GitHub → Actions → "Veritabanı Yedekleme" → "Run workflow".

Yerelde denemek için:

```bash
DATABASE_URL="..." BLOB_READ_WRITE_TOKEN="..." node scripts/backup.mjs
```

### Geri yükleme

1. İlgili `.dump` dosyasını Vercel Blob panelinden (veya `@vercel/blob`'un `list()`/
   `download` akışıyla) indirin.
2. Boş bir veritabanına geri yükleyin:

   ```bash
   pg_restore --no-owner --no-privileges -d "$HEDEF_DATABASE_URL" plazalar-YYYY-MM-DD.dump
   ```

   Var olan bir veritabanının üzerine geri yüklemeden önce mutlaka önce boş/ayrı bir
   veritabanında deneyin ve satır sayılarını (`SELECT count(*) FROM ...`) orijinaliyle
   karşılaştırın.
