import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { LINK_PLAZA_BUDGET_2026 } from "../src/lib/budget/link-plaza-2026.ts";

function sqlStr(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}
function sqlNum(v) {
  if (v === null || v === undefined) return "NULL";
  return String(v);
}
function sqlBool(v) {
  return v ? "true" : "false";
}

const YEAR = 2026;
const SECTIONS = [
  { name: "A- PERSONEL GİDERLERİ", key: "personnelRows", sortOrder: 0 },
  { name: "YÖNETİM GİDERLERİ", key: "managementRows", sortOrder: 1 },
  { name: "DİĞER GİDERLER", key: "otherRows", sortOrder: 2 },
];

const lines = [];
lines.push("-- Link Plaza 2026 gerçekleşen bütçe verisi (Ocak-Haziran, seed.ts ile aynı veriden üretildi)");
lines.push("-- Neon SQL Editor'de çalıştırın. Bu script idempotent DEĞİLDİR — yalnızca bir kez çalıştırın.");
lines.push("");
lines.push("DO $$");
lines.push("DECLARE");
lines.push('  v_plaza_id TEXT;');
lines.push("BEGIN");
lines.push(`  SELECT id INTO v_plaza_id FROM plazas WHERE name = 'Link Plaza';`);
lines.push("  IF v_plaza_id IS NULL THEN");
lines.push("    RAISE EXCEPTION 'Link Plaza bulunamadı';");
lines.push("  END IF;");
lines.push("");

for (const s of SECTIONS) {
  const sectionId = randomUUID();
  lines.push(`  -- ${s.name}`);
  lines.push(
    `  INSERT INTO budget_sections (id, "plazaId", year, name, "sortOrder", "createdAt") VALUES (${sqlStr(sectionId)}, v_plaza_id, ${YEAR}, ${sqlStr(s.name)}, ${s.sortOrder}, now());`
  );

  const q1Rows = LINK_PLAZA_BUDGET_2026[0][s.key];
  const q2Rows = LINK_PLAZA_BUDGET_2026[1][s.key];

  for (let i = 0; i < q1Rows.length; i++) {
    const row = q1Rows[i];
    const itemId = randomUUID();
    lines.push(
      `  INSERT INTO budget_line_items (id, "sectionId", category, label, "monthlyBudget", "isFixedContract", "fixedAmount", fill, "sortOrder", "createdAt", "updatedAt") VALUES (${sqlStr(itemId)}, ${sqlStr(sectionId)}, ${sqlStr(row.category ?? null)}, ${sqlStr(row.label)}, ${sqlNum(row.monthlyBudget)}, ${sqlBool(false)}, NULL, ${sqlStr(row.fill ?? null)}, ${i}, now(), now());`
    );

    const monthlyActuals = [...q1Rows[i].months, ...q2Rows[i].months];
    for (let m = 0; m < monthlyActuals.length; m++) {
      const entryId = randomUUID();
      lines.push(
        `  INSERT INTO budget_month_entries (id, "lineItemId", month, confirmed, "manualAmount", "updatedAt") VALUES (${sqlStr(entryId)}, ${sqlStr(itemId)}, ${m + 1}, false, ${sqlNum(monthlyActuals[m])}, now());`
      );
    }
  }
  lines.push("");
}

lines.push("END $$;");
lines.push("");

writeFileSync(new URL("../budget-seed-production.sql", import.meta.url), lines.join("\n"));
console.log("wrote budget-seed-production.sql");
