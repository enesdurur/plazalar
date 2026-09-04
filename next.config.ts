import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Fatura/bakım formu yüklemeleri Server Action'lar üzerinden gidiyor;
      // Next'in varsayılan 1MB gövde sınırı bunu MAX_FILE_SIZE (15MB, bkz.
      // src/lib/attachments/service.ts) altındaki dosyalarda bile reddediyordu.
      bodySizeLimit: "16mb",
    },
  },
  // Temel güvenlik header'ları — daha önce hiç ayarlanmamıştı. CSP bilinçli olarak
  // dışarıda bırakıldı: inline script/style envanteri çıkarılmadan eklemek uygulamayı
  // kırma riski taşıyor, ayrı bir iş olarak ele alınmalı.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
