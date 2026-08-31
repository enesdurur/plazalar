import { writeFileSync } from "node:fs";
import { TENANT_MAINTENANCE_SCHEDULES } from "../src/lib/plan/tenant-maintenance-types.ts";

function sqlStr(v) {
  return `'${String(v).replace(/'/g, "''")}'`;
}

const lines = [];
lines.push(
  "-- Kiracı Bakımları: her kiracı için standart bakım kalemleri (Fancoil Bakımı, Elektrik Bakımı)."
);
lines.push(
  "-- Tenant ID'leri sabit yazılmadı — plazadaki her kiracı satırı SQL içinde dinamik olarak"
);
lines.push(
  "-- bulunuyor, bu yüzden hangi ortamda (local/production) çalıştırılırsa çalıştırılsın kiracı"
);
lines.push(
  "-- eşleşmesi sorunsuz olur. UPSERT yapar: kalem (tenantId,label) zaten varsa scheduledWeeks'i"
);
lines.push("-- bu tablodaki güncel değerle değiştirir — daha önce eski (aylık) varsayımla");
lines.push("-- oluşturmuş olsanız bile bunu tekrar çalıştırmak güvenlidir.");
lines.push(
  "-- ÖN KOŞUL: bu script'ten önce tenant_maintenance_items / tenant_maintenance_week_entries"
);
lines.push("-- tablolarını oluşturan migration (05) uygulanmış olmalı.");
lines.push("");
lines.push("DO $$");
lines.push("DECLARE");
lines.push("  v_plaza_id TEXT;");
lines.push("  v_tenant RECORD;");
lines.push("BEGIN");
lines.push(`  SELECT id INTO v_plaza_id FROM plazas WHERE name = 'Link Plaza';`);
lines.push("  IF v_plaza_id IS NULL THEN");
lines.push("    RAISE EXCEPTION 'Link Plaza bulunamadı';");
lines.push("  END IF;");
lines.push("");

let sortOrder = 0;
for (const [label, weeks] of Object.entries(TENANT_MAINTENANCE_SCHEDULES)) {
  const weeksArrayLiteral = `ARRAY[${weeks.join(",")}]::INTEGER[]`;
  lines.push(`  -- ${label}`);
  lines.push('  FOR v_tenant IN SELECT id FROM tenants WHERE "plazaId" = v_plaza_id LOOP');
  lines.push(
    '    INSERT INTO tenant_maintenance_items (id, "tenantId", label, "scheduledWeeks", "sortOrder", "createdAt", "updatedAt")'
  );
  lines.push(
    `    VALUES (substr(md5(random()::text || clock_timestamp()::text), 1, 25), v_tenant.id, ${sqlStr(label)}, ${weeksArrayLiteral}, ${sortOrder}, now(), now())`
  );
  lines.push(
    '    ON CONFLICT ("tenantId", label) DO UPDATE SET "scheduledWeeks" = EXCLUDED."scheduledWeeks", "sortOrder" = EXCLUDED."sortOrder", "updatedAt" = now();'
  );
  lines.push("  END LOOP;");
  lines.push("");
  sortOrder++;
}

lines.push("END $$;");
lines.push("");

writeFileSync(
  new URL("../tenant-maintenance-seed-production.sql", import.meta.url),
  lines.join("\n")
);
console.log("wrote tenant-maintenance-seed-production.sql");
