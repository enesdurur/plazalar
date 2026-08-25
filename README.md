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
