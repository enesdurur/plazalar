import { writeFileSync } from "node:fs";
import {
  TENANT_MAINTENANCE_TYPES,
  defaultMonthlyScheduledWeeks,
} from "../src/lib/plan/tenant-maintenance-types.ts";

function sqlStr(v) {
  return `'${String(v).replace(/'/g, "''")}'`;
}

const weeks = defaultMonthlyScheduledWeeks();
const typesArrayLiteral = `ARRAY[${TENANT_MAINTENANCE_TYPES.map(sqlStr).join(",")}]::TEXT[]`;
const weeksArrayLiteral = `ARRAY[${weeks.join(",")}]::INTEGER[]`;

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
lines.push("-- eşleşmesi sorunsuz olur. İdempotenttir — zaten var olan (tenantId, label) atlanır.");
lines.push(
  "-- ÖN KOŞUL: bu script'ten önce tenant_maintenance_items / tenant_maintenance_week_entries"
);
lines.push("-- tablolarını oluşturan migration (05) uygulanmış olmalı.");
lines.push("");
lines.push("DO $$");
lines.push("DECLARE");
lines.push("  v_plaza_id TEXT;");
lines.push("  v_tenant RECORD;");
lines.push("  v_type TEXT;");
lines.push(`  v_types TEXT[] := ${typesArrayLiteral};`);
lines.push(`  v_weeks INTEGER[] := ${weeksArrayLiteral};`);
lines.push("  v_sort INT;");
lines.push("BEGIN");
lines.push(`  SELECT id INTO v_plaza_id FROM plazas WHERE name = 'Link Plaza';`);
lines.push("  IF v_plaza_id IS NULL THEN");
lines.push("    RAISE EXCEPTION 'Link Plaza bulunamadı';");
lines.push("  END IF;");
lines.push("");
lines.push('  FOR v_tenant IN SELECT id FROM tenants WHERE "plazaId" = v_plaza_id LOOP');
lines.push("    v_sort := 0;");
lines.push("    FOREACH v_type IN ARRAY v_types LOOP");
lines.push(
  '      INSERT INTO tenant_maintenance_items (id, "tenantId", label, "scheduledWeeks", "sortOrder", "createdAt", "updatedAt")'
);
lines.push(
  "      SELECT substr(md5(random()::text || clock_timestamp()::text), 1, 25), v_tenant.id, v_type, v_weeks, v_sort, now(), now()"
);
lines.push(
  '      WHERE NOT EXISTS (SELECT 1 FROM tenant_maintenance_items WHERE "tenantId" = v_tenant.id AND label = v_type);'
);
lines.push("      v_sort := v_sort + 1;");
lines.push("    END LOOP;");
lines.push("  END LOOP;");
lines.push("END $$;");
lines.push("");

writeFileSync(
  new URL("../tenant-maintenance-seed-production.sql", import.meta.url),
  lines.join("\n")
);
console.log("wrote tenant-maintenance-seed-production.sql");
