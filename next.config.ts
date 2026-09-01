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
};

export default nextConfig;
