"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatCostAmount } from "@/components/spare-part-cost-tile";

export type MoneyValue = { amount: number; currency: "TRY" | "USD" | "EUR" } | null;

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
  render: (row: T) => React.ReactNode;
  /** Text used both for header-dropdown filtering and as the unique-value label. Omit to make the column non-filterable. */
  filterValue?: (row: T) => string;
  /** Marks this column as a money column: contributes to the totals footer row. */
  money?: (row: T) => MoneyValue;
  /**
   * Fixed column width (e.g. "140px"). If every column provides one, the table renders with
   * table-layout: fixed and a matching <colgroup> — useful when two separate DataTable
   * instances (e.g. "devam eden" / "tamamlanan" splits) need their columns to line up.
   */
  width?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage: string;
  renderActions?: (row: T) => React.ReactNode;
  maxHeight?: string;
  /** Width for the actions column (only used when every column has a fixed width). */
  actionsWidth?: string;
}

function sumMoney<T>(rows: T[], getMoney: (row: T) => MoneyValue) {
  const totals: Record<"TRY" | "USD" | "EUR", number> = { TRY: 0, USD: 0, EUR: 0 };
  for (const row of rows) {
    const m = getMoney(row);
    if (m) totals[m.currency] += m.amount;
  }
  return totals;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  renderActions,
  maxHeight = "70vh",
  actionsWidth,
}: DataTableProps<T>) {
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const fixedLayout = columns.every((c) => c.width);
  const totalWidth = fixedLayout
    ? columns.reduce((sum, c) => sum + parseFloat(c.width!), 0) +
      (renderActions ? parseFloat(actionsWidth ?? "100px") : 0)
    : undefined;
  const scrollRef = useRef<HTMLDivElement>(null);

  const uniqueValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of columns) {
      if (!col.filterValue) continue;
      const seen = new Set<string>();
      for (const row of rows) seen.add(col.filterValue(row));
      map[col.key] = [...seen].sort((a, b) => a.localeCompare(b, "tr"));
    }
    return map;
  }, [columns, rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      columns.every((col) => {
        if (!col.filterValue) return true;
        const active = filters[col.key];
        if (!active || active.size === 0) return true;
        return active.has(col.filterValue(row));
      })
    );
  }, [rows, columns, filters]);

  const moneyColumns = columns.filter((c) => c.money);
  const showFooter = moneyColumns.length > 0;
  const columnCount = columns.length + (renderActions ? 1 : 0);
  const activeFilterCount = Object.values(filters).filter((s) => s.size > 0).length;

  return (
    <div>
      {activeFilterCount > 0 && (
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500 print:hidden">
          <span>
            {filteredRows.length} / {rows.length} kayıt gösteriliyor ({activeFilterCount} filtre
            aktif)
          </span>
          <button
            type="button"
            onClick={() => setFilters({})}
            className="font-medium text-slate-700 underline hover:text-slate-900"
          >
            Filtreleri temizle
          </button>
        </div>
      )}
      <div
        ref={scrollRef}
        className="max-h-[var(--dt-max-h)] overflow-auto rounded-lg border border-slate-200 bg-white"
        style={{ ["--dt-max-h" as string]: maxHeight }}
      >
        <table
          className={fixedLayout ? "divide-y divide-slate-200 text-sm" : "min-w-full divide-y divide-slate-200 text-sm"}
          style={
            fixedLayout
              ? { tableLayout: "fixed", width: "100%", minWidth: totalWidth }
              : undefined
          }
        >
          {fixedLayout && (
            <colgroup>
              {columns.map((col) => (
                <col key={col.key} style={{ width: col.width }} />
              ))}
              {renderActions && <col style={{ width: actionsWidth ?? "100px" }} />}
            </colgroup>
          )}
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium text-slate-600 ${
                    col.align === "right" ? "text-right" : "text-left"
                  } ${col.className ?? ""}`}
                >
                  <div
                    className={`flex items-center gap-1 ${
                      col.align === "right" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span>{col.header}</span>
                    {col.filterValue && (
                      <FilterDropdown
                        options={uniqueValues[col.key] ?? []}
                        selected={filters[col.key] ?? new Set()}
                        onChange={(next) =>
                          setFilters((prev) => ({ ...prev, [col.key]: next }))
                        }
                        scrollRef={scrollRef}
                      />
                    )}
                  </div>
                </th>
              ))}
              {renderActions && <th className="px-4 py-3 print:hidden" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row) => (
              <tr
                key={rowKey(row)}
                className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${col.align === "right" ? "text-right" : ""} ${
                      col.className ?? ""
                    }`}
                  >
                    {col.render(row)}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-4 py-3 text-right print:hidden">
                    <div className="flex justify-end gap-3">{renderActions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-8 text-center text-slate-500">
                  {rows.length === 0 ? emptyMessage : "Filtreyle eşleşen kayıt yok."}
                </td>
              </tr>
            )}
          </tbody>
          {showFooter && filteredRows.length > 0 && (
            <tfoot className="sticky bottom-0 z-10 bg-slate-100">
              <tr>
                {columns.map((col, idx) => {
                  if (idx === 0) {
                    return (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-left font-semibold text-slate-700"
                      >
                        Toplam
                      </td>
                    );
                  }
                  if (!col.money) return <td key={col.key} className="px-4 py-3" />;
                  const totals = sumMoney(filteredRows, col.money);
                  return (
                    <td
                      key={col.key}
                      className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-900"
                    >
                      {formatCostAmount(totals.TRY, "TRY")}
                      {totals.USD > 0 && ` · ${formatCostAmount(totals.USD, "USD")}`}
                      {totals.EUR > 0 && ` · ${formatCostAmount(totals.EUR, "EUR")}`}
                    </td>
                  );
                })}
                {renderActions && <td className="px-4 py-3 print:hidden" />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function FilterDropdown({
  options,
  selected,
  onChange,
  scrollRef,
}: {
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const active = selected.size > 0;

  useEffect(() => {
    if (!open) return;
    const scrollEl = scrollRef.current;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleScroll(e: Event) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    scrollEl?.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
      scrollEl?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, scrollRef]);

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
      setSearch("");
    }
    setOpen((o) => !o);
  }

  const filteredOptions = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );
  const allChecked = options.length > 0 && selected.size === options.length;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className={`rounded p-0.5 hover:bg-slate-200 print:hidden ${
          active ? "text-slate-900" : "text-slate-400"
        }`}
        aria-label="Filtrele"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
          <path d="M1 2h14l-5.5 6.5V14l-3-1.5V8.5L1 2z" />
        </svg>
      </button>
      {open && pos && (
        <div
          ref={panelRef}
          className="fixed z-50 w-56 rounded-md border border-slate-200 bg-white p-2 text-xs font-normal normal-case text-slate-700 shadow-lg"
          style={{ top: pos.top, left: pos.left }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara..."
            className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none"
          />
          <div className="max-h-52 overflow-auto">
            <label className="flex items-center gap-2 border-b border-slate-100 px-1 py-1 font-medium">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={() => onChange(allChecked ? new Set() : new Set(options))}
              />
              (Tümü)
            </label>
            {filteredOptions.map((opt) => {
              const checked = selected.has(opt);
              return (
                <label key={opt} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = new Set(selected);
                      if (checked) next.delete(opt);
                      else next.add(opt);
                      onChange(next);
                    }}
                  />
                  <span className="truncate">{opt || "(boş)"}</span>
                </label>
              );
            })}
            {filteredOptions.length === 0 && (
              <p className="px-1 py-2 text-slate-400">Sonuç yok.</p>
            )}
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => onChange(new Set())}
              className="text-slate-500 hover:text-slate-800"
            >
              Temizle
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-medium text-slate-900 hover:underline"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </>
  );
}
