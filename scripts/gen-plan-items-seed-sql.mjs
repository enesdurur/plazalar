import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import {
  MAINTENANCE_PLAN_ITEMS_2026,
  INSPECTION_PLAN_ITEMS_2026,
} from "../src/lib/plan/link-plaza-2026.ts";

function sqlStr(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}
function sqlNum(v) {
  if (v === null || v === undefined) return "NULL";
  return String(v);
}

const lines = [];
lines.push(
  "-- Link Plaza 2026 Yıllık Bakım Planı + Periyodik (Fenni) Muayene kalemleri (seed.ts ile aynı veriden üretildi)"
);
lines.push(
  "-- Neon SQL Editor'de çalıştırın. İdempotenttir — aynı kalem (plazaId+label) zaten varsa tekrar eklenmez."
);
lines.push("");
lines.push("DO $$");
lines.push("DECLARE");
lines.push("  v_plaza_id TEXT;");
lines.push("BEGIN");
lines.push(`  SELECT id INTO v_plaza_id FROM plazas WHERE name = 'Link Plaza';`);
lines.push("  IF v_plaza_id IS NULL THEN");
lines.push("    RAISE EXCEPTION 'Link Plaza bulunamadı';");
lines.push("  END IF;");
lines.push("");

function machineIdExpr(machineName) {
  if (!machineName) return "NULL";
  return `(SELECT id FROM machines WHERE "plazaId" = v_plaza_id AND name = ${sqlStr(machineName)} LIMIT 1)`;
}

lines.push("  -- Yıllık Bakım Planı");
MAINTENANCE_PLAN_ITEMS_2026.forEach((row, i) => {
  const itemId = randomUUID();
  lines.push(
    `  INSERT INTO maintenance_plan_items (id, "plazaId", "machineId", label, company, "yearlyCount", "sortOrder", "createdAt", "updatedAt") ` +
      `SELECT ${sqlStr(itemId)}, v_plaza_id, ${machineIdExpr(row.machineName)}, ${sqlStr(row.label)}, ${sqlStr(row.company)}, ${sqlNum(row.yearlyCount)}, ${i}, now(), now() ` +
      `WHERE NOT EXISTS (SELECT 1 FROM maintenance_plan_items WHERE "plazaId" = v_plaza_id AND label = ${sqlStr(row.label)});`
  );
});
lines.push("");

lines.push("  -- Periyodik (Fenni) Muayene");
INSPECTION_PLAN_ITEMS_2026.forEach((row, i) => {
  const itemId = randomUUID();
  lines.push(
    `  INSERT INTO inspection_plan_items (id, "plazaId", "machineId", label, company, "yearlyCount", "sortOrder", "createdAt", "updatedAt") ` +
      `SELECT ${sqlStr(itemId)}, v_plaza_id, ${machineIdExpr(row.machineName)}, ${sqlStr(row.label)}, ${sqlStr(row.company)}, ${sqlNum(row.yearlyCount)}, ${i}, now(), now() ` +
      `WHERE NOT EXISTS (SELECT 1 FROM inspection_plan_items WHERE "plazaId" = v_plaza_id AND label = ${sqlStr(row.label)});`
  );
});
lines.push("");

lines.push("END $$;");
lines.push("");

writeFileSync(new URL("../plan-items-seed-production.sql", import.meta.url), lines.join("\n"));
console.log("wrote plan-items-seed-production.sql");
